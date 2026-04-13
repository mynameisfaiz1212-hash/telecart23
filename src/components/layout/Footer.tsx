import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">B</span>
              </div>
              <span className="text-lg font-bold">Book Demo</span>
            </div>
            <p className="text-sm opacity-60 leading-relaxed">
              Your trusted marketplace for discovering the best software and business solutions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Home</Link></li>
              <li><a href="#categories" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Categories</a></li>
              <li><a href="#offers" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Offers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Contact Us</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Privacy Policy</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm">Connect</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Twitter</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">LinkedIn</a></li>
              <li><a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center">
          <p className="text-sm opacity-50">© {new Date().getFullYear()} Book Demo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
