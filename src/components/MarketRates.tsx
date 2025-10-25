import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Bell,
  BarChart3,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import { findClosestDistrict } from "../utils/locationData";
import { marketApi } from "../utils/api";

export interface MarketRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  min_price: string;
  max_price: string;
  modal_price: string;
  arrival_date: string;
}

export interface IFilters {
  state: string;
  district: string;
  market: string;
  commodity: string;
  search: string;
  searchMethod: "default" | "location";
}

export type ApiFilters = Omit<IFilters, "searchMethod">;

export interface ApiResponse {
  success: boolean;
  data?: {
    records: MarketRecord[];
    total?: number;
    count?: number;
  };
  error?: string;
  message?: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const POPULAR_COMMODITIES = [
  "Wheat", "Rice", "Paddy", "Maize", "Bajra", "Jowar", "Cotton", "Soybean",
  "Groundnut", "Mustard", "Sunflower", "Tomato", "Potato", "Onion", "Garlic",
  "Chilli", "Turmeric", "Coriander", "Cumin", "Tea", "Coffee", "Sugarcane",
  "Banana", "Mango", "Orange", "Apple", "Grapes",
];

const INITIAL_FILTERS: IFilters = {
  state: "",
  district: "",
  market: "",
  commodity: "",
  search: "",
  searchMethod: "default",
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  collapsed: { opacity: 0, y: 20, transition: { duration: 0.2 } }
};

export function MarketRates() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [marketData, setMarketData] = useState<MarketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<IFilters>(INITIAL_FILTERS);

  const allDataOptions = useMemo(() => {
    const districts = [...new Set(marketData.map(item => item.district))].filter(Boolean).sort();
    const markets = [...new Set(marketData.map(item => item.market))].filter(Boolean).sort();
    const commodities = [...new Set(marketData.map(item => item.commodity))].filter(Boolean).sort();
    return { districts, markets, commodities };
  }, [marketData]);

  const fetchMarketData = useCallback(async (currentFilters: IFilters) => {
    setLoading(true);
    setError(null);
    try {
      const apiParams: ApiFilters = {
        state: currentFilters.state,
        district: currentFilters.district,
        market: currentFilters.market,
        commodity: currentFilters.commodity,
        search: currentFilters.search,
      };

      const response: ApiResponse = await marketApi.getPrices(apiParams);

      if (response.success && response.data) {
        setMarketData(response.data.records || []);
      } else {
        setError(response.error || "Failed to fetch market data");
        setMarketData([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      setMarketData([]);
      console.error("Market data fetch error:", err);
    } finally {
      setLoading(false);
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData(filters);
  }, []);

  const submitFilters = (newFilters: IFilters) => {
    setFilters(newFilters);
    fetchMarketData(newFilters);
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    submitFilters({ ...filters, searchMethod: "default" });
  };

  const handleClearFilters = () => {
    const newFilters: IFilters = { ...INITIAL_FILTERS };
    setFilters(newFilters);
    setShowFilters(false);
    submitFilters(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value, searchMethod: "default" });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowFilters(false);
    submitFilters({ ...filters, searchMethod: "default" });
  };

  const handleLocateNearest = () => {
    setIsLocating(true);
    setError(null);
    setShowFilters(false);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const closestDistrict = findClosestDistrict(latitude, longitude);

        if (closestDistrict) {
          const newFilters: IFilters = {
            ...INITIAL_FILTERS,
            state: closestDistrict.state,
            district: closestDistrict.district,
            searchMethod: "location",
          };
          submitFilters(newFilters);
        } else {
          setError("Could not find a nearby district in our database.");
          setIsLocating(false);
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        let errorMsg = "Unable to retrieve location.";
        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please grant permission in browser settings.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable.";
        } else if (geoError.code === geoError.TIMEOUT) {
          errorMsg = "Location request timed out.";
        }
        setError(errorMsg);
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const calculatePriceChange = (minPrice: string, maxPrice: string): string => {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (isNaN(min) || isNaN(max) || min === 0) return "0.0";
    return (((max - min) / min) * 100).toFixed(1);
  };

  const hasActiveFilters = filters.state || filters.district || filters.market || filters.commodity || filters.search;
  const isLocationSearch = filters.searchMethod === 'location';

  const filteredDistricts = useMemo(() => {
    if (!filters.state) return allDataOptions.districts;
    return [...new Set(marketData.filter(d => d.state === filters.state).map(d => d.district))].filter(Boolean).sort();
  }, [filters.state, marketData, allDataOptions.districts]);

  const filteredMarkets = useMemo(() => {
    if (!filters.district) {
      if (filters.state) {
        return [...new Set(marketData.filter(d => d.state === filters.state).map(d => d.market))].filter(Boolean).sort();
      }
      return allDataOptions.markets;
    }
    return [...new Set(marketData.filter(d => d.district === filters.district).map(d => d.market))].filter(Boolean).sort();
  }, [filters.district, filters.state, marketData, allDataOptions.markets]);

  const combinedCommodities = useMemo(() => {
    const popularSet = new Set(POPULAR_COMMODITIES);
    const otherAvailable = allDataOptions.commodities.filter(c => !popularSet.has(c));
    const availablePopular = POPULAR_COMMODITIES.filter(p => allDataOptions.commodities.includes(p));
    return {
      popular: availablePopular,
      other: otherAvailable,
    };
  }, [allDataOptions.commodities]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg font-semibold text-foreground flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-green-500" />
              Live Market Prices
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground"
            >
              {loading ? "Updating..." : `${marketData.length} results found`}
            </motion.p>
          </div>
          <div className="flex gap-2">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                aria-label="Refresh Data"
                variant="outline"
                size="icon"
                onClick={() => fetchMarketData(filters)}
                disabled={loading || isLocating}
              >
                <RefreshCw className={`w-4 h-4 ${loading && !isLocating ? 'animate-spin' : ''}`} />
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                aria-label="Find Nearest Mandi"
                variant="outline"
                size="icon"
                onClick={handleLocateNearest}
                disabled={loading || isLocating}
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </Button>
            </motion.div>

            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button variant="outline" size="sm" className="relative">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {(hasActiveFilters || isLocationSearch) && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
                      />
                    )}
                  </Button>
                </motion.div>
              </SheetTrigger>

              <SheetContent
                side="bottom"
                className="h-[85vh] p-0 flex flex-col bg-gradient-to-b from-white to-gray-50 border-t-2 border-primary/20 rounded-t-3xl"
              >
                {/* Handle Bar */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2"></div>

                <SheetHeader className="px-6 pt-2 pb-4 border-b bg-white/80 backdrop-blur-sm">
                  <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    Search & Filter Markets
                  </SheetTitle>
                  <SheetDescription className="text-sm">
                    Find specific market prices near you
                  </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="filter" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="grid w-full grid-cols-2 mx-6 mt-4 bg-white shadow-sm h-11">
                    <TabsTrigger value="filter" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location
                    </TabsTrigger>
                    <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Search className="w-4 h-4 mr-2" />
                      Commodity
                    </TabsTrigger>
                  </TabsList>

                  {/* Filter Tab */}
                  <TabsContent value="filter" className="flex-1 overflow-hidden m-0 mt-4">
                    <ScrollArea className="h-full px-6">
                      <div className="space-y-4 pb-6">
                        {/* State Card */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                          <Label htmlFor="state-filter" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Select State
                          </Label>
                          <Select
                            value={filters.state || "all-states"}
                            onValueChange={(value) => {
                              setFilters({
                                ...INITIAL_FILTERS,
                                search: filters.search,
                                commodity: filters.commodity,
                                state: value === "all-states" ? "" : value,
                                searchMethod: "default",
                              });
                            }}
                          >
                            <SelectTrigger id="state-filter" className="h-12 bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Choose your state" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <SelectItem value="all-states" className="font-medium">🇮🇳 All States</SelectItem>
                              {INDIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </motion.div>

                        {/* District Card */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                          <Label htmlFor="district-filter" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Select District
                            {!filters.state && (
                              <span className="text-xs text-amber-600 ml-2 font-normal">
                                (Select state first)
                              </span>
                            )}
                          </Label>
                          <Select
                            value={filters.district || "all-districts"}
                            onValueChange={(value) => {
                              setFilters({
                                ...filters,
                                district: value === "all-districts" ? "" : value,
                                market: "",
                                searchMethod: "default",
                              });
                            }}
                            disabled={!filters.state || filteredDistricts.length === 0}
                          >
                            <SelectTrigger
                              id="district-filter"
                              className={`h-12 ${!filters.state ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 border-gray-200'}`}
                            >
                              <SelectValue placeholder={!filters.state ? "Select state first" : "Choose district"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <SelectItem value="all-districts" className="font-medium">📍 All Districts</SelectItem>
                              {filteredDistricts.map((district) => (
                                <SelectItem key={district} value={district}>
                                  {district}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </motion.div>

                        {/* Market Card */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                          <Label htmlFor="market-filter" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Select Market / Mandi
                            {!filters.district && (
                              <span className="text-xs text-amber-600 ml-2 font-normal">
                                (Select district first)
                              </span>
                            )}
                          </Label>
                          <Select
                            value={filters.market || "all-markets"}
                            onValueChange={(value) => {
                              setFilters({
                                ...filters,
                                market: value === "all-markets" ? "" : value,
                                searchMethod: "default"
                              });
                            }}
                            disabled={!filters.district || filteredMarkets.length === 0}
                          >
                            <SelectTrigger
                              id="market-filter"
                              className={`h-12 ${!filters.district ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 border-gray-200'}`}
                            >
                              <SelectValue placeholder={!filters.district ? "Select district first" : "Choose market"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <SelectItem value="all-markets" className="font-medium">🏪 All Markets</SelectItem>
                              {filteredMarkets.map((market) => (
                                <SelectItem key={market} value={market}>
                                  {market}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </motion.div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Search Tab */}
                  <TabsContent value="search" className="flex-1 overflow-hidden m-0 mt-4">
                    <ScrollArea className="h-full px-6">
                      <div className="space-y-4 pb-6">
                        {/* Search Input Card */}
                        <motion.form
                          onSubmit={handleSearchSubmit}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                          <Label htmlFor="search-input" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Search Commodity Name
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="search-input"
                              placeholder="e.g., Wheat, Tomato, Rice..."
                              value={filters.search}
                              onChange={handleSearchChange}
                              className="h-12 bg-gray-50 border-gray-200"
                            />
                            <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
                              <Search className="w-5 h-5" />
                            </Button>
                          </div>
                        </motion.form>

                        {/* Commodity Select Card */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                          <Label htmlFor="commodity-select" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Or Select from List
                          </Label>
                          <Select
                            value={filters.commodity || "all-commodities"}
                            onValueChange={(value) => {
                              setFilters({
                                ...filters,
                                commodity: value === "all-commodities" ? "" : value,
                                search: "",
                                searchMethod: "default"
                              });
                            }}
                          >
                            <SelectTrigger id="commodity-select" className="h-12 bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Choose a commodity" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <SelectItem value="all-commodities" className="font-medium">🌾 All Commodities</SelectItem>
                              {combinedCommodities.popular.length > 0 && (
                                <>
                                  <div className="px-2 py-2 text-xs font-bold text-primary border-b">
                                    ⭐ POPULAR COMMODITIES
                                  </div>
                                  {combinedCommodities.popular.map((commodity) => (
                                    <SelectItem key={`pop-${commodity}`} value={commodity} className="pl-6">
                                      {commodity}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              {combinedCommodities.other.length > 0 && (
                                <>
                                  <div className="px-2 py-2 text-xs font-bold text-gray-600 border-b mt-2">
                                    📋 OTHER AVAILABLE
                                  </div>
                                  {combinedCommodities.other.map((commodity) => (
                                    <SelectItem key={`other-${commodity}`} value={commodity} className="pl-6">
                                      {commodity}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </motion.div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons - Fixed at Bottom */}
                <div className="flex gap-3 p-6 pt-4 border-t bg-white shadow-lg mt-auto">
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    className="flex-1 h-12 font-semibold"
                    disabled={!hasActiveFilters && !isLocationSearch}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    onClick={handleApplyFilters}
                    className="flex-1 h-12 font-semibold bg-primary hover:bg-primary/90"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters */}
        <AnimatePresence>
          {(hasActiveFilters || isLocationSearch) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-2 mt-3"
            >
              <span className="text-xs text-muted-foreground mr-1">Filters:</span>

              {isLocationSearch && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  <MapPin className="w-3 h-3 mr-1" />
                  Near: {filters.district}, {filters.state}
                  <button
                    onClick={() => submitFilters(INITIAL_FILTERS)}
                    className="ml-1.5 opacity-70 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.state && !isLocationSearch && (
                <Badge variant="secondary" className="text-xs">
                  {filters.state}
                  <button
                    onClick={() => submitFilters({ ...INITIAL_FILTERS, search: filters.search, commodity: filters.commodity })}
                    className="ml-1.5 opacity-70 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.district && !isLocationSearch && (
                <Badge variant="secondary" className="text-xs">
                  {filters.district}
                  <button
                    onClick={() => submitFilters({ ...filters, district: "", market: "" })}
                    className="ml-1.5 opacity-70 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.market && (
                <Badge variant="secondary" className="text-xs">
                  {filters.market}
                  <button
                    onClick={() => submitFilters({ ...filters, market: "" })}
                    className="ml-1.5 opacity-70 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.commodity && (
                <Badge variant="secondary" className="text-xs">
                  {filters.commodity}
                  <button
                    onClick={() => submitFilters({ ...filters, commodity: "" })}
                    className="ml-1.5 opacity-70 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{filters.search}"
                  <button
                    onClick={() => submitFilters({ ...filters, search: "" })}
                    className="ml-1.5 opacity-70 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center pt-16"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground mt-4">
              {isLocating ? "Finding nearest district..." : "Loading market data..."}
            </p>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-destructive font-medium mb-1">Error Loading Data</h4>
                  <p className="text-sm text-red-700 mb-3">{error}</p>
                  <Button size="sm" onClick={() => fetchMarketData(filters)} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {!loading && !error && marketData.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-16"
          >
            <Card className="p-8 text-center border-dashed">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-muted-foreground mb-2">
                No market data found for your selection.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or search terms.
              </p>
              {(hasActiveFilters || isLocationSearch) && (
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </Card>
          </motion.div>
        )}

        {!loading && !error && marketData.length > 0 && (
          <div className="space-y-4">
            {marketData.slice(0, 50).map((item, index) => {
              const priceChange = calculatePriceChange(item.min_price, item.max_price);
              const modalPrice = parseFloat(item.modal_price) || 0;
              const isCardExpanded = expandedCard === index;

              return (
                <motion.div
                  key={`${item.state}-${item.district}-${item.market}-${item.commodity}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(index * 0.05, 0.5),
                    type: "spring",
                    stiffness: 100,
                  }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <motion.div
                      layout
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedCard(isCardExpanded ? null : index)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-2">
                          <h3 className="font-semibold text-foreground mb-1">{item.commodity}</h3>
                          <p className="text-xs text-muted-foreground">
                            {item.market}, {item.district}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.state}</p>
                        </div>
                        {parseFloat(priceChange) !== 0 && (
                          <Badge
                            variant={parseFloat(priceChange) > 0 ? "default" : "destructive"}
                            className={`flex items-center gap-1 ${
                              parseFloat(priceChange) > 0
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                                : 'border border-destructive/30'
                            }`}
                          >
                            {parseFloat(priceChange) > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {Math.abs(parseFloat(priceChange))}%
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          ₹{modalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-muted-foreground">/quintal</span>
                      </div>

                      <AnimatePresence initial={false}>
                        {isCardExpanded && (
                          <motion.div
                            key="content"
                            initial="collapsed"
                            animate="open"
                            exit="collapsed"
                            variants={{
                              open: { opacity: 1, height: "auto" },
                              collapsed: { opacity: 0, height: 0 }
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="border-t pt-3 mt-2 space-y-3">
                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <motion.div variants={itemVariants} className="p-2 bg-gray-100/50 rounded border">
                                  <p className="text-xs text-muted-foreground mb-0.5">Variety</p>
                                  <p className="text-foreground font-medium">{item.variety || "-"}</p>
                                </motion.div>
                                <motion.div variants={itemVariants} className="p-2 bg-gray-100/50 rounded border">
                                  <p className="text-xs text-muted-foreground mb-0.5">Grade</p>
                                  <p className="text-foreground font-medium">{item.grade || "-"}</p>
                                </motion.div>
                                <motion.div variants={itemVariants} className="p-2 bg-gray-100/50 rounded border col-span-2">
                                  <p className="text-xs text-muted-foreground mb-0.5">Arrival Date</p>
                                  <p className="text-foreground font-medium">{item.arrival_date || "-"}</p>
                                </motion.div>
                              </div>

                              {/* Price Details */}
                              <motion.div variants={itemVariants} className="p-3 bg-blue-50/60 rounded space-y-1 border border-blue-200">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Min Price:</span>
                                  <span className="text-foreground">
                                    ₹{parseFloat(item.min_price).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Max Price:</span>
                                  <span className="text-foreground">
                                    ₹{parseFloat(item.max_price).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                  <span className="text-muted-foreground">Modal Price:</span>
                                  <span className="text-foreground font-bold">
                                    ₹{modalPrice.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </motion.div>

                              {/* Action Buttons */}
                              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 pt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Set alert for:", item.commodity, item.market);
                                  }}
                                >
                                  <Bell className="w-4 h-4" /> Set Alert
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Compare:", item.commodity, item.market);
                                  }}
                                  disabled
                                >
                                  <BarChart3 className="w-4 h-4" /> Compare
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Card>
                </motion.div>
              );
            })}

            {marketData.length > 50 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-4 text-center mt-4 border-dashed">
                  <p className="text-sm text-muted-foreground mb-1">
                    Showing first 50 of {marketData.length} results
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use filters to narrow down your search further.
                  </p>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}