import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Globe, MapPin, Users, Calendar, Star, MessageSquare } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Globe className="text-primary text-2xl mr-2" />
              <span className="text-xl font-bold text-gray-900">All In Travel</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-primary transition-colors">How it Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-primary transition-colors">Testimonials</a>
            </nav>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-r from-primary to-secondary">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
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
            
            <div className="bg-white rounded-lg p-2 flex items-center shadow-lg">
              <MapPin className="text-gray-400 ml-3 mr-2" size={20} />
              <Input 
                placeholder="Where do you want to go?" 
                className="flex-1 border-0 outline-none text-gray-900 bg-transparent"
              />
              <Button className="bg-primary text-white hover:bg-primary/90">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Perfect Travel
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From discovering hidden gems to connecting with fellow travelers, All In Travel provides all the tools you need for an amazing journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <MapPin className="text-primary text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">Interactive Maps</h3>
                <p className="text-gray-600">
                  Explore destinations with detailed maps showing restaurants, hotels, and attractions with real-time information.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Users className="text-primary text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">Travel Companions</h3>
                <p className="text-gray-600">
                  Find like-minded travelers for your next adventure. Connect, plan, and explore together safely.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Star className="text-primary text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">Reviews & Ratings</h3>
                <p className="text-gray-600">
                  Read authentic reviews from fellow travelers and share your own experiences to help others.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <MessageSquare className="text-primary text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">Community Chat</h3>
                <p className="text-gray-600">
                  Join city-specific chat rooms to get real-time tips and advice from locals and other travelers.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Calendar className="text-primary text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">Events & Activities</h3>
                <p className="text-gray-600">
                  Discover local events, festivals, and activities happening during your visit.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Globe className="text-primary text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">Global Community</h3>
                <p className="text-gray-600">
                  Join a worldwide community of travelers sharing experiences across 127+ countries.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-gray-600">Places Reviewed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">15K+</div>
              <div className="text-gray-600">Happy Travelers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">127</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">8K+</div>
              <div className="text-gray-600">Travel Connections</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join thousands of travelers who trust All In Travel for their adventures.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-3"
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Globe className="text-primary text-2xl mr-2" />
                <span className="text-xl font-bold text-gray-900">All In Travel</span>
              </div>
              <p className="text-gray-600 mb-4">
                Your ultimate companion for discovering amazing places, connecting with fellow travelers, and creating unforgettable memories around the world.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Explore</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Popular Destinations</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Top Restaurants</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Best Hotels</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Travel Guides</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm">© 2024 All In Travel. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
