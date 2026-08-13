import Link from "next/link";
import { Activity, Heart, Shield, Droplet, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-24 pb-32">
        <div className="absolute inset-0 bg-brand-500/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-500/10 via-background to-background"></div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-8 border border-brand-100">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
            </span>
            Live Emergency Response Network
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
            When Every <span className="text-brand-600 relative">
              Drop <Droplet className="absolute -top-6 -right-6 text-brand-200 w-12 h-12 -z-10" />
            </span> Matters.
          </h1>
          
          <p className="mt-6 text-xl md:text-2xl text-foreground/70 max-w-3xl mx-auto mb-10 leading-relaxed">
            HemoGo connects people who need blood with nearby donors during emergencies in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/request" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-600 text-white font-semibold text-lg hover:bg-brand-700 transition-all shadow-lg hover:shadow-brand-500/30 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Request Blood <Activity className="w-5 h-5" />
            </Link>
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-foreground font-semibold text-lg hover:bg-gray-50 border border-gray-200 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Become a Donor <Heart className="w-5 h-5 text-brand-500" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How HemoGo Works</h2>
            <p className="text-foreground/60 max-w-2xl mx-auto">Our platform uses advanced location matching to find the right donors quickly while maintaining complete privacy.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="glassmorphism rounded-2xl p-8 hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center mb-6 text-brand-600">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Privacy First</h3>
              <p className="text-foreground/70">Your contact info is never public. It is only shared securely when you accept a specific emergency request.</p>
            </div>

            {/* Feature 2 */}
            <div className="glassmorphism rounded-2xl p-8 hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Alerts</h3>
              <p className="text-foreground/70">Receive immediate push notifications when someone in your PIN code needs your exact blood group.</p>
            </div>

            {/* Feature 3 */}
            <div className="glassmorphism rounded-2xl p-8 hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6 text-amber-600">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Save Lives</h3>
              <p className="text-foreground/70">Respond with a single tap, pass the short eligibility screener, and directly connect with the hospital or patient.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
