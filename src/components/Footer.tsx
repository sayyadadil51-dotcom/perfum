import { Link } from 'react-router-dom';
import { Leaf, Mail, MapPin, Phone, Instagram, Linkedin, Twitter } from 'lucide-react';
import { Brand } from '@/components/Brand';
import { CO2_FACTOR } from '@/data/categories';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Brand />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            ScrapKart connects households, shops and factories with verified recyclers — so nothing
            valuable ends up in a landfill.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Leaf className="h-4 w-4 text-primary" />
            <span>
              Every kg recycled saves up to{' '}
              {Math.max(...Object.values(CO2_FACTOR)).toFixed(1)} kg CO₂
            </span>
          </div>
          <div className="mt-4 flex gap-2">
            {[
              { icon: Instagram, label: 'Instagram' },
              { icon: Twitter, label: 'Twitter' },
              { icon: Linkedin, label: 'LinkedIn' },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Marketplace</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-primary" to="/rates">Today's scrap rates</Link></li>
            <li><Link className="hover:text-primary" to="/how-it-works">How it works</Link></li>
            <li><Link className="hover:text-primary" to="/signup">Sell your scrap</Link></li>
            <li><Link className="hover:text-primary" to="/signup?role=buyer">Become a dealer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-primary" to="/login">Log in</Link></li>
            <li><Link className="hover:text-primary" to="/profile">Profile & settings</Link></li>
            <li><Link className="hover:text-primary" to="/support">Contact / support</Link></li>
            <li><Link className="hover:text-primary" to="/support#faq">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Reach us</h4>
          <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>2nd Floor, IT Park, Gayatri Nagar, Nagpur, Maharashtra 440022</span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <a href="tel:+919000000001" className="hover:text-primary">+91 90000 00001</a>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <a href="mailto:help@scrapkart.in" className="hover:text-primary">help@scrapkart.in</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ScrapKart Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="flex items-center gap-3">
            <span>Made for a cleaner India 🇮🇳</span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <button className="hover:text-primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to top
            </button>
          </p>
        </div>
      </div>
    </footer>
  );
}
