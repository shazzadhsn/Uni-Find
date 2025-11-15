import { Search, ShieldCheck, Heart, Users, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Header } from './Header';
import { ThemeToggle } from './ThemeToggle';
import bubtLogo from 'figma:asset/214c4e35fc9a4a250613608e16c49b5b475361e2.png';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onAdminLoginClick: () => void;
}

export function LandingPage({ onLoginClick, onRegisterClick, onAdminLoginClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      <Header />
      
      <header className="border-b border-purple-200/50 dark:border-purple-900/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 dark:shadow-purple-700/50 transform hover:scale-105 transition-transform">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                UniFind
              </h1>
              <p className="text-xs text-purple-600 dark:text-purple-400">Lost & Found Community</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={onAdminLoginClick}
              variant="ghost"
              size="sm"
              className="gap-2 text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-sm text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <img src={bubtLogo} alt="BUBT Logo" className="w-5 h-5 object-contain" />
                Bangladesh University of Business & Technology
              </div>
              
              <h2 className="text-5xl md:text-6xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                Find What Matters
              </h2>
              
              <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                Lost something precious? Found an item? Join our caring community where students and faculty help each other reunite with their belongings.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={onRegisterClick}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-700/50 group"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={onLoginClick}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950"
                >
                  Login
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Secure & Private</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-20 dark:opacity-10"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-purple-100 dark:border-purple-900">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-gray-100 mb-1">Report & Search</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create detailed reports with photos and descriptions to help reunite items with their owners.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl border border-purple-200 dark:border-purple-800">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-gray-100 mb-1">Connect & Chat</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Direct messaging to coordinate item returns with instant notifications and updates.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border border-green-200 dark:border-green-800">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-gray-100 mb-1">Community Care</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Join a trusted network of students and faculty helping each other every day.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <div className="text-2xl text-purple-600 dark:text-purple-400">500+</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Items Found</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                    <div>
                      <div className="text-2xl text-purple-600 dark:text-purple-400">1000+</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Active Users</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                    <div>
                      <div className="text-2xl text-purple-600 dark:text-purple-400">24/7</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 rounded-full border border-purple-200 dark:border-purple-800">
              <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <span className="text-gray-700 dark:text-gray-300">
                Made with care for the BUBT community
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-purple-200/50 dark:border-purple-900/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                UniFind - BUBT Lost & Found
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2025 Bangladesh University of Business and Technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}