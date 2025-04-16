import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import MarketplaceItem from "@/components/marketplace/marketplace-item";
import CreateListing from "@/components/marketplace/create-listing";
import UserListings from "@/components/marketplace/user-listings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { formatTokenAmount } from "@/lib/contract-utils";
import { 
  Search, Plus, Filter, SlidersHorizontal, X, ArrowUpDown, ArrowRight,
  ShoppingBag, Package, Download, Briefcase, Award, MoreHorizontal,
  Code, Image, BookOpen, Gamepad2, FileText, Music, Video,
  Code2, Palette, Headphones, Target, PenTool, GraduationCap, DollarSign,
  Cpu, Shirt, Watch, Home, Book, Hammer, Heart, 
  CreditCard, Brush, Trophy, Bot, CircleDollarSign, Clock, Mail,
  Bitcoin, FileImage, Globe, Users, Ticket, Tag,
  LayoutDashboard, Grid2X2, Tag as TagIcon, Gem
} from "lucide-react";

interface MarketplaceItemMetadata {
  subcategory?: string;
  condition?: string;
  tags?: string[];
  features?: string[];
}

interface MarketplaceItemType {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  metadata?: string; // JSON string that will be parsed
  createdAt: string;
  approved: boolean;
  sold: boolean;
  parsedMetadata?: MarketplaceItemMetadata;
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sort, setSort] = useState<"newest" | "price_low" | "price_high" | "alpha">("newest");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch marketplace items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/marketplace", selectedCategory, selectedSubcategory, priceRange, sort, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      
      if (selectedSubcategory !== "all") {
        params.append("subcategory", selectedSubcategory);
      }
      
      if (priceRange[0] > 0 || priceRange[1] < 1000) {
        params.append("minPrice", priceRange[0].toString());
        params.append("maxPrice", priceRange[1].toString());
      }
      
      // Map sort values to backend sort parameters
      if (sort) {
        if (sort === "newest") {
          params.append("sortBy", "createdAt");
          params.append("sortOrder", "desc");
        } else if (sort === "price_low") {
          params.append("sortBy", "price");
          params.append("sortOrder", "asc");
        } else if (sort === "price_high") {
          params.append("sortBy", "price");
          params.append("sortOrder", "desc");
        } else if (sort === "alpha") {
          params.append("sortBy", "title");
          params.append("sortOrder", "asc");
        }
      }
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const endpoint = `/api/marketplace?${params.toString()}`;
      const res = await apiRequest("GET", endpoint);
      const data = await res.json();
      
      // Parse metadata for each item
      return data.map((item: MarketplaceItemType) => {
        if (item.metadata) {
          try {
            item.parsedMetadata = JSON.parse(item.metadata);
          } catch (e) {
            console.error("Error parsing metadata for item", item.id, e);
            item.parsedMetadata = {};
          }
        } else {
          item.parsedMetadata = {};
        }
        return item;
      });
    }
  });

  // Categories with icons
  const categories = [
    { id: "all", name: "All Items", icon: "ShoppingBag" },
    { id: "digital", name: "Digital Goods", icon: "Download" },
    { id: "services", name: "Services", icon: "Briefcase" },
    { id: "physical", name: "Physical Items", icon: "Package" },
    { id: "collectibles", name: "Collectibles", icon: "Award" },
    { id: "crypto", name: "Crypto Assets", icon: "Bitcoin" },
    { id: "other", name: "Other", icon: "MoreHorizontal" }
  ];

  // Subcategories with improved organization and icons
  const subcategories = {
    digital: [
      { id: "all", name: "All Digital", icon: "Download" },
      { id: "software", name: "Software", icon: "Code" },
      { id: "art", name: "Digital Art", icon: "Image" },
      { id: "ebooks", name: "E-Books", icon: "BookOpen" },
      { id: "games", name: "Games", icon: "Gamepad2" },
      { id: "templates", name: "Templates", icon: "FileText" },
      { id: "audio", name: "Audio & Music", icon: "Music" },
      { id: "videos", name: "Videos", icon: "Video" }
    ],
    services: [
      { id: "all", name: "All Services", icon: "Briefcase" },
      { id: "development", name: "Development", icon: "Code2" },
      { id: "design", name: "Design", icon: "Palette" },
      { id: "consulting", name: "Consulting", icon: "Headphones" },
      { id: "marketing", name: "Marketing", icon: "Target" },
      { id: "writing", name: "Writing & Translation", icon: "PenTool" },
      { id: "teaching", name: "Teaching & Tutoring", icon: "GraduationCap" },
      { id: "financial", name: "Financial Services", icon: "DollarSign" }
    ],
    physical: [
      { id: "all", name: "All Physical", icon: "Package" },
      { id: "electronics", name: "Electronics", icon: "Cpu" },
      { id: "apparel", name: "Apparel", icon: "Shirt" },
      { id: "accessories", name: "Accessories", icon: "Watch" },
      { id: "home", name: "Home & Garden", icon: "Home" },
      { id: "books", name: "Books & Magazines", icon: "Book" },
      { id: "handmade", name: "Handmade Items", icon: "Hammer" },
      { id: "health", name: "Health & Beauty", icon: "Heart" }
    ],
    collectibles: [
      { id: "all", name: "All Collectibles", icon: "Award" },
      { id: "cards", name: "Trading Cards", icon: "CreditCard" },
      { id: "art", name: "Art Collectibles", icon: "Brush" },
      { id: "memorabilia", name: "Memorabilia", icon: "Trophy" },
      { id: "toys", name: "Toys & Figures", icon: "Bot" },
      { id: "coins", name: "Coins & Currency", icon: "CircleDollarSign" },
      { id: "antiques", name: "Antiques", icon: "Clock" },
      { id: "stamps", name: "Stamps", icon: "Mail" }
    ],
    crypto: [
      { id: "all", name: "All Crypto", icon: "Bitcoin" },
      { id: "tokens", name: "Tokens", icon: "CircleDollarSign" },
      { id: "nfts", name: "NFTs", icon: "FileImage" },
      { id: "domains", name: "Crypto Domains", icon: "Globe" },
      { id: "mining", name: "Mining Equipment", icon: "Pickaxe" },
      { id: "memberships", name: "Memberships", icon: "Users" }
    ],
    other: [
      { id: "all", name: "All Others", icon: "MoreHorizontal" },
      { id: "tickets", name: "Event Tickets", icon: "Ticket" },
      { id: "vouchers", name: "Vouchers & Coupons", icon: "Tag" },
      { id: "misc", name: "Miscellaneous", icon: "Package" }
    ]
  };

  // Get current subcategories
  const currentSubcategories = selectedCategory !== "all" 
    ? subcategories[selectedCategory as keyof typeof subcategories] || []
    : [];

  // Filter items by search query, category, subcategory, and price
  const filteredItems = items.filter((item: MarketplaceItemType) => {
    // Match search query
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Match category
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    // Match subcategory
    const matchesSubcategory = selectedSubcategory === "all" || 
      (item.parsedMetadata?.subcategory === selectedSubcategory);
    
    // Match price range
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <MobileMenu />

      <main className="flex-grow">
        {/* Desktop Header */}
        <header className="hidden lg:flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm p-4">
          <h2 className="text-xl font-semibold">Marketplace</h2>
          
          {/* Token Balance Display */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full py-1 px-4">
            <span className="mr-2 text-yellow-500">
              <i className="fas fa-coin"></i>
            </span>
            <span className="font-medium">{formatTokenAmount(user?.tokenBalance || 0)}</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">$TSK</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* Marketplace Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Marketplace</h2>
              <p className="text-gray-500 dark:text-gray-400">Buy and sell products using $TSK tokens</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Search marketplace..." 
                  className="pl-10 pr-4 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="py-2 px-4 flex items-center justify-center">
                    <Plus className="h-4 w-4 mr-2" /> List Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <CreateListing 
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      refetch();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Category Tabs - Optimized for mobile with grid view on small screens */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
            {/* Mobile Category Grid View */}
            <div className="md:hidden grid grid-cols-4 gap-2">
              {categories.map(category => {
                // Dynamically get the icon component
                const IconComponent = 
                  category.icon === "ShoppingBag" ? ShoppingBag :
                  category.icon === "Download" ? Download :
                  category.icon === "Briefcase" ? Briefcase :
                  category.icon === "Package" ? Package :
                  category.icon === "Award" ? Award :
                  category.icon === "Bitcoin" ? Bitcoin :
                  category.icon === "MoreHorizontal" ? MoreHorizontal : ShoppingBag;
                
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="flex flex-col items-center justify-center h-20 p-1 text-center"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedSubcategory("all");
                    }}
                  >
                    <IconComponent className="w-6 h-6 mb-1" />
                    <span className="text-xs line-clamp-2">{category.name}</span>
                  </Button>
                );
              })}
            </div>
            
            {/* Desktop horizontal scrolling list */}
            <div className="hidden md:flex overflow-x-auto space-x-4 pb-2">
              {categories.map(category => {
                // Dynamically get the icon component
                const IconComponent = 
                  category.icon === "ShoppingBag" ? ShoppingBag :
                  category.icon === "Download" ? Download :
                  category.icon === "Briefcase" ? Briefcase :
                  category.icon === "Package" ? Package :
                  category.icon === "Award" ? Award :
                  category.icon === "Bitcoin" ? Bitcoin :
                  category.icon === "MoreHorizontal" ? MoreHorizontal : ShoppingBag;
                
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="min-w-max"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedSubcategory("all");
                    }}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
          
          {/* Filter & Sort */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Filters Section */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Active Filters */}
                {selectedCategory !== "all" && (
                  <Badge className="flex items-center gap-1 px-3 py-1">
                    Category: {categories.find(c => c.id === selectedCategory)?.name}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setSelectedCategory("all")} 
                    />
                  </Badge>
                )}
                
                {selectedSubcategory !== "all" && (
                  <Badge className="flex items-center gap-1 px-3 py-1">
                    Subcategory: {currentSubcategories.find(c => c.id === selectedSubcategory)?.name}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setSelectedSubcategory("all")} 
                    />
                  </Badge>
                )}
                
                {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                  <Badge className="flex items-center gap-1 px-3 py-1">
                    Price: {priceRange[0]} - {priceRange[1]} TSK
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setPriceRange([0, 1000])} 
                    />
                  </Badge>
                )}
                
                {/* Filter Button */}
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Filters</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Filter Options</h4>
                        <p className="text-sm text-muted-foreground">Refine marketplace listings</p>
                      </div>
                      <Separator />
                      
                      {/* Subcategory filter (only show if a category is selected) */}
                      {selectedCategory !== "all" && currentSubcategories.length > 0 && (
                        <div className="grid gap-2">
                          <div className="grid grid-cols-3 items-center">
                            <span className="text-sm">Subcategory</span>
                            <div className="col-span-2">
                              <Select 
                                value={selectedSubcategory} 
                                onValueChange={setSelectedSubcategory}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentSubcategories.map(subcategory => {
                                    // Get the appropriate icon component
                                    let IconComponent;
                                    switch(subcategory.icon) {
                                      // Digital icons
                                      case "Download": IconComponent = Download; break;
                                      case "Code": IconComponent = Code; break;
                                      case "Image": IconComponent = Image; break;
                                      case "BookOpen": IconComponent = BookOpen; break;
                                      case "Gamepad2": IconComponent = Gamepad2; break;
                                      case "FileText": IconComponent = FileText; break;
                                      case "Music": IconComponent = Music; break;
                                      case "Video": IconComponent = Video; break;
                                      
                                      // Services icons
                                      case "Briefcase": IconComponent = Briefcase; break;
                                      case "Code2": IconComponent = Code2; break;
                                      case "Palette": IconComponent = Palette; break;
                                      case "Headphones": IconComponent = Headphones; break;
                                      case "Target": IconComponent = Target; break;
                                      case "PenTool": IconComponent = PenTool; break;
                                      case "GraduationCap": IconComponent = GraduationCap; break;
                                      case "DollarSign": IconComponent = DollarSign; break;
                                      
                                      // Physical items icons
                                      case "Package": IconComponent = Package; break;
                                      case "Cpu": IconComponent = Cpu; break;
                                      case "Shirt": IconComponent = Shirt; break;
                                      case "Watch": IconComponent = Watch; break;
                                      case "Home": IconComponent = Home; break;
                                      case "Book": IconComponent = Book; break;
                                      case "Hammer": IconComponent = Hammer; break;
                                      case "Heart": IconComponent = Heart; break;
                                      
                                      // Collectibles icons
                                      case "Award": IconComponent = Award; break;
                                      case "CreditCard": IconComponent = CreditCard; break;
                                      case "Brush": IconComponent = Brush; break;
                                      case "Trophy": IconComponent = Trophy; break;
                                      case "Bot": IconComponent = Bot; break;
                                      case "CircleDollarSign": IconComponent = CircleDollarSign; break;
                                      case "Clock": IconComponent = Clock; break;
                                      case "Mail": IconComponent = Mail; break;
                                      
                                      // Crypto icons
                                      case "Bitcoin": IconComponent = Bitcoin; break;
                                      case "FileImage": IconComponent = FileImage; break;
                                      case "Globe": IconComponent = Globe; break;
                                      case "Users": IconComponent = Users; break;
                                      
                                      // Other icons
                                      case "MoreHorizontal": IconComponent = MoreHorizontal; break;
                                      case "Ticket": IconComponent = Ticket; break;
                                      case "Tag": IconComponent = Tag; break;
                                      
                                      // Default icon
                                      default: IconComponent = Package;
                                    }
                                    
                                    return (
                                      <SelectItem key={subcategory.id} value={subcategory.id}>
                                        <div className="flex items-center">
                                          <IconComponent className="w-4 h-4 mr-2" />
                                          {subcategory.name}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Price range filter */}
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center">
                          <span className="text-sm">Price Range</span>
                          <div className="col-span-2 pl-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs">{priceRange[0]} TSK</span>
                              <span className="text-xs">{priceRange[1]} TSK</span>
                            </div>
                            <Slider
                              defaultValue={priceRange}
                              max={1000}
                              step={10}
                              onValueChange={(values) => setPriceRange(values as [number, number])}
                              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Reset Filters */}
                {(selectedCategory !== "all" || 
                  selectedSubcategory !== "all" || 
                  priceRange[0] > 0 || 
                  priceRange[1] < 1000) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedSubcategory("all");
                      setPriceRange([0, 1000]);
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
              
              {/* Sort Section */}
              <div className="flex-shrink-0">
                <Select 
                  value={sort}
                  onValueChange={(value: "newest" | "price_low" | "price_high" | "alpha") => setSort(value)}
                >
                  <SelectTrigger className="w-[180px] h-8">
                    <span className="flex items-center gap-1">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <SelectValue placeholder="Sort By" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="alpha">Name: A to Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Marketplace Content Tabs */}
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="mb-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Browse Items
              </TabsTrigger>
              <TabsTrigger value="my-listings" className="flex items-center gap-2">
                <Package className="h-4 w-4" /> My Listings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse">
              {/* Browse All Marketplace Items */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">Loading marketplace items...</p>
                </div>
              ) : filteredItems.length > 0 ? (
                <>
                  {/* When viewing all items and no category selected, show organized sections */}
                  {selectedCategory === "all" && !searchQuery ? (
                    <div className="space-y-8">
                      {/* Group items by category */}
                      {Object.keys(subcategories).map(categoryKey => {
                        const categoryItems = filteredItems.filter((item: MarketplaceItemType) => item.category === categoryKey);
                        if (categoryItems.length === 0) return null;
                        
                        // Get category info
                        const categoryInfo = categories.find(c => c.id === categoryKey);
                        
                        // Get icon component
                        const IconComponent = 
                          categoryInfo?.icon === "Download" ? Download :
                          categoryInfo?.icon === "Briefcase" ? Briefcase :
                          categoryInfo?.icon === "Package" ? Package :
                          categoryInfo?.icon === "Award" ? Award :
                          categoryInfo?.icon === "Bitcoin" ? Bitcoin :
                          categoryInfo?.icon === "MoreHorizontal" ? MoreHorizontal : ShoppingBag;
                        
                        return (
                          <div key={categoryKey} className="mb-8">
                            <div className="flex items-center mb-4">
                              <IconComponent className="w-5 h-5 mr-2" />
                              <h2 className="text-xl font-semibold truncate">{categoryInfo?.name}</h2>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="ml-2"
                                onClick={() => setSelectedCategory(categoryKey)}
                              >
                                <span className="hidden sm:inline">View All</span>
                                <ArrowRight className="h-4 w-4 sm:ml-1" />
                              </Button>
                            </div>
                            
                            {/* Mobile view - scrollable horizontal items */}
                            <div className="sm:hidden -mx-4 px-4 pb-4">
                              <div className="flex overflow-x-auto space-x-4 snap-x scrollbar-hide">
                                {categoryItems.slice(0, 8).map((item: MarketplaceItemType) => (
                                  <div key={item.id} className="snap-start flex-shrink-0 w-40 md:w-64">
                                    <MarketplaceItem 
                                      item={item}
                                      onPurchaseSuccess={refetch}
                                      condensed={true}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Desktop grid view */}
                            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {/* Show only first 4 items per category */}
                              {categoryItems.slice(0, 4).map((item: MarketplaceItemType) => (
                                <MarketplaceItem 
                                  key={item.id}
                                  item={item}
                                  onPurchaseSuccess={refetch}
                                />
                              ))}
                            </div>
                            
                            {categoryItems.length > (window.innerWidth < 640 ? 8 : 4) && (
                              <div className="text-center mt-4">
                                <Button 
                                  variant="outline"
                                  onClick={() => setSelectedCategory(categoryKey)}
                                >
                                  <span className="hidden sm:inline">View All {categoryInfo?.name}</span>
                                  <span className="sm:hidden">View All</span>
                                  <span className="ml-1">({categoryItems.length})</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Regular grid view for filtered results
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredItems.map((item: MarketplaceItemType) => (
                        <MarketplaceItem 
                          key={item.id}
                          item={item}
                          onPurchaseSuccess={refetch}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No items found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {searchQuery
                      ? "No items match your search criteria."
                      : selectedCategory !== "all"
                        ? `No items found in the ${categories.find(c => c.id === selectedCategory)?.name} category.`
                        : "There are no items in the marketplace yet."}
                  </p>
                  
                  {/* Show different actions based on context */}
                  {searchQuery ? (
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      <X className="h-4 w-4 mr-2" /> Clear Search
                    </Button>
                  ) : selectedCategory !== "all" ? (
                    <Button variant="outline" onClick={() => setSelectedCategory("all")}>
                      <ArrowUpDown className="h-4 w-4 mr-2" /> View All Categories
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" /> List Your Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <CreateListing onSuccess={() => refetch()} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my-listings">
              {/* User's Own Marketplace Listings with Delete Functionality */}
              <UserListings />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
