import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/mindly-logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Mindly Academy" className="h-20 w-auto brightness-0 invert" />
            </Link>
            <p className="text-primary-foreground/70 text-sm">
              Монголын тэргүүлэх онлайн сургалтын платформ. Мэргэжлийн багш нартай хамтран чанартай боловсролыг танд хүргэнэ.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Сургалтууд</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/courses?category=web" className="hover:text-accent transition-colors">
                  Веб хөгжүүлэлт
                </Link>
              </li>
              <li>
                <Link to="/courses?category=programming" className="hover:text-accent transition-colors">
                  Програмчлал
                </Link>
              </li>
              <li>
                <Link to="/courses?category=ai" className="hover:text-accent transition-colors">
                  AI сургалт
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-accent transition-colors">
                  Бүх сургалтууд
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Тусламж</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/faq" className="hover:text-accent transition-colors">
                  Түгээмэл асуултууд
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Холбоо барих
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent transition-colors">
                  Үйлчилгээний нөхцөл
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-accent transition-colors">
                  Нууцлалын бодлого
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Холбоо барих</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <a href="mailto:info@mindly.mn" className="hover:text-accent transition-colors">
                  info@mindly.mn
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                <a href="tel:+97699123456" className="hover:text-accent transition-colors">
                  +976 9912 3456
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-accent mt-0.5" />
                <span>Улаанбаатар хот, Сүхбаатар дүүрэг</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} Mindly Academy. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
