import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative h-96 bg-gradient-to-r from-primary to-secondary">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      {/* Background image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=800')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="text-white max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Discover Your Next Adventure
          </h1>
          <p className="text-xl mb-8 text-gray-100">
            Connect with fellow travelers, find hidden gems, and create unforgettable memories with our interactive travel guide.
          </p>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg p-2 flex items-center shadow-lg">
            <MapPin className="text-gray-400 ml-3 mr-2" size={20} />
            <Input 
              placeholder="Where do you want to go?" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-0 outline-none text-gray-900 bg-transparent focus:ring-0"
            />
            <Button 
              onClick={handleSearch}
              className="bg-primary text-white hover:bg-primary/90 shrink-0"
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
