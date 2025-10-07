import React, { useState, useEffect, useRef } from "react";
import {
  FiBatteryCharging,
  FiFeather,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiTrendingUp,
  FiZap,
  FiUser,
  FiLogOut,
  FiShoppingCart,
} from "react-icons/fi";
import { FaStar, FaQuoteLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/accountSlice";

// --- Custom Hook for Scroll-triggered Animations ---
const useAnimateOnScroll = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
};

const EVCoShipHomepage = () => {
  useAnimateOnScroll();
  const account = useSelector((store) => store.account);

  // --- START: Authentication State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const user = {
    name: "Alex Reid",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=2080", // A sample avatar image
  };
  const dispatch = useDispatch();

  // Handlers to simulate authentication state changes
  const handleLogout = () => {
    // logout
    // clear state in redux

    dispatch(logout());
  };
  // --- END: Authentication State ---

  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const products = [
    {
      name: "Apex",
      price: "$2,799",
      image:
        "https://images.unsplash.com/photo-1620027734496-2f08b35b6c82?auto=format&fit=crop&q=80&w=2062",
      description:
        "The pinnacle of urban commuting technology. Sleek, powerful, and effortlessly stylish.",
      specs: { range: "70 mi", speed: "28 mph" },
    },
    {
      name: "Vortex",
      price: "$3,499",
      image:
        "https://images.unsplash.com/photo-1627961958410-a9f4e2f5b355?auto=format&fit=crop&q=80&w=2062",
      description:
        "Conquer any terrain with this rugged, all-adventure electric mountain bike.",
      specs: { range: "60 mi", speed: "25 mph" },
    },
    {
      name: "Glide",
      price: "$1,999",
      image:
        "https://images.unsplash.com/photo-1598226463239-7a020f5a728b?auto=format&fit=crop&q=80&w=2062",
      description:
        "Lightweight and agile, the Glide is the perfect companion for your city life.",
      specs: { range: "50 mi", speed: "20 mph" },
    },
  ];
  const testimonials = [
    {
      quote:
        "VOLT completely transformed my commute. The Apex is not just a bike; it's a statement. Smooth, fast, and turns heads everywhere.",
      author: "Jessica M.",
      rating: 5,
    },
    {
      quote:
        "As an avid mountain biker, I was skeptical about e-bikes. The Vortex proved me wrong. It climbs like a beast and is insanely fun.",
      author: "David L.",
      rating: 5,
    },
    {
      quote:
        "The Glide is perfect for my daily errands. It's so light and the battery lasts forever. I can't imagine my life without it now.",
      author: "Sarah K.",
      rating: 5,
    },
  ];

  const nextProduct = () =>
    setCurrentProduct((prev) => (prev + 1) % products.length);
  const prevProduct = () =>
    setCurrentProduct((prev) => (prev - 1 + products.length) % products.length);
  const nextTestimonial = () =>
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  const prevTestimonial = () =>
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );

  const sectionClasses = "py-20 md:py-28 px-6 md:px-12 max-w-7xl mx-auto";

  return (
    <div className="bg-dark-bg text-text-color font-sans overflow-x-hidden">
      <style>{`.reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; } .reveal.is-visible { opacity: 1; transform: translateY(0); }`}</style>

      {/* --- HEADER --- */}
      <header
        className={`fixed top-0 left-0 w-full flex justify-between items-center px-6 md:px-12 py-4 z-50 transition-all duration-300 ${
          isHeaderScrolled
            ? "bg-dark-bg/90 backdrop-blur-lg border-b border-border-color"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="text-3xl font-bold tracking-widest cursor-pointer">
          VOLT
        </div>

        <nav className="hidden md:flex gap-8 items-center">
          <a
            href="#models"
            className="text-white hover:text-primary transition-colors"
          >
            Models
          </a>
          <a
            href="#features"
            className="text-white hover:text-primary transition-colors"
          >
            Features
          </a>
          <a
            href="#contact"
            className="text-white hover:text-primary transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* --- DYNAMIC AUTH SECTION --- */}
        <div className="flex items-center gap-4">
          {account ? (
            // --- LOGGED IN STATE ---
            <div
              className="text-white relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="flex items-center gap-3 cursor-pointer">
                <span className="hidden sm:inline font-semibold">
                  {account.fullName}
                </span>
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-secondary-bg rounded-lg shadow-lg border border-border-color py-2 animate-fade-in-up animation-delay-0">
                  <a
                    href="#"
                    className="text-white flex items-center gap-3 px-4 py-2 text-sm text-text-color hover:bg-dark-bg transition-colors"
                  >
                    <FiUser /> My Profile
                  </a>
                  <a
                    href="#"
                    className="text-white flex items-center gap-3 px-4 py-2 text-sm text-text-color hover:bg-dark-bg transition-colors"
                  >
                    <FiShoppingCart /> Order History
                  </a>
                  <div className="border-t border-border-color my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-dark-bg transition-colors"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            // --- NOT LOGGED IN STATE ---
            <div className="text-white flex items-center gap-4">
              {/* --- LOGIN (GHOST BUTTON) --- */}
              <Link
                to="/login"
                className="font-semibold px-5 py-2 rounded-full bg-transparent border border-border-color text-text-muted hover:border-primary hover:text-primary transition-all duration-300"
              >
                Login
              </Link>

              {/* --- REGISTER (SOLID BUTTON WITH INVERTED HOVER) --- */}
              <Link
                to="/register"
                className="ext-white font-semibold px-5 py-2 rounded-full bg-primary border-2 border-primary  hover:bg-transparent hover:text-primary transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* --- Hero Section (and the rest of the page remains the same) --- */}
      <section className="h-screen flex items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-background-zoom"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1620802051782-725fa33db067?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/70 to-transparent"></div>
        </div>
        <div className="z-10 px-4">
          <h1
            className="text-5xl md:text-7xl font-bold mb-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Ride the Future.
          </h1>
          <p
            className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-8 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            Unleash unparalleled performance and iconic design. Welcome to the
            electric revolution.
          </p>
          <button
            className="bg-primary text-black font-semibold px-10 py-4 rounded-full hover:bg-white hover:-translate-y-1 transform transition-all duration-300 text-lg shadow-lg shadow-primary/30 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.8s" }}
          >
            Discover Our Bikes
          </button>
        </div>
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.2s" }}
        >
          <div className="w-6 h-10 border-2 border-text-muted rounded-full flex justify-center pt-2 animate-pulse-slow">
            <div className="w-1 h-2 bg-text-muted rounded-full"></div>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="features" className={sectionClasses}>
        <h2 className="text-4xl font-bold text-center mb-16 reveal">
          Why VOLT?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: FiBatteryCharging,
              title: "Extended Range",
              text: "Journey up to 70 miles on a single charge, pushing the boundaries of exploration.",
            },
            {
              icon: FiFeather,
              title: "Featherlight Frame",
              text: "Crafted from aerospace-grade aluminum for an agile and responsive ride.",
            },
            {
              icon: FiZap,
              title: "Instant Power",
              text: "Experience exhilarating acceleration with our fine-tuned silent motor.",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-secondary-bg p-8 rounded-2xl text-center border border-border-color hover:border-primary hover:-translate-y-2 transition-all duration-300 group reveal"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="inline-block p-4 bg-dark-bg rounded-full mb-6 border border-border-color group-hover:bg-primary transition-colors duration-300">
                <feature.icon className="text-4xl text-primary group-hover:text-black transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-text-muted leading-relaxed">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ... (The rest of the component from the previous step remains unchanged) ... */}

      {/* --- Product Showcase Section --- */}
      <section id="models" className={`${sectionClasses} bg-secondary-bg`}>
        <h2 className="text-4xl font-bold text-center mb-16 reveal">
          Meet Your Next Ride
        </h2>
        <div className="relative max-w-6xl mx-auto">
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentProduct * 100}%)` }}
            >
              {products.map((product) => (
                <div
                  key={product.name}
                  className="flex-shrink-0 w-full grid grid-cols-1 lg:grid-cols-2 gap-0 items-center"
                >
                  <div className="h-80 lg:h-full w-full">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8 md:p-12 bg-secondary-bg">
                    <h3 className="text-4xl font-bold mb-4">{product.name}</h3>
                    <p className="text-text-muted mb-6 h-20">
                      {product.description}
                    </p>
                    <div className="flex gap-8 mb-8 border-t border-b border-border-color py-4">
                      <div className="text-center">
                        <FiTrendingUp className="text-primary text-2xl mx-auto mb-1" />
                        <span className="font-bold text-lg">
                          {product.specs.range}
                        </span>
                        <p className="text-sm text-text-muted">Range</p>
                      </div>
                      <div className="text-center">
                        <FiZap className="text-primary text-2xl mx-auto mb-1" />
                        <span className="font-bold text-lg">
                          {product.specs.speed}
                        </span>
                        <p className="text-sm text-text-muted">Top Speed</p>
                      </div>
                    </div>
                    <div className="text-4xl font-semibold text-primary mb-6">
                      {product.price}
                    </div>
                    <button className="bg-transparent text-primary font-semibold px-8 py-3 rounded-full border-2 border-primary hover:bg-primary hover:text-black transition-colors duration-300">
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={prevProduct}
            className="absolute top-1/2 -translate-y-1/2 -left-6 w-12 h-12 rounded-full bg-dark-bg/50 border border-border-color flex items-center justify-center hover:bg-primary hover:text-black transition-all backdrop-blur-sm z-10"
          >
            &lt;
          </button>
          <button
            onClick={nextProduct}
            className="absolute top-1/2 -translate-y-1/2 -right-6 w-12 h-12 rounded-full bg-dark-bg/50 border border-border-color flex items-center justify-center hover:bg-primary hover:text-black transition-all backdrop-blur-sm z-10"
          >
            &gt;
          </button>
        </div>
      </section>

      {/* --- Testimonials Section --- */}
      <section className={sectionClasses}>
        <h2 className="text-4xl font-bold text-center mb-16 reveal">
          Trusted by Riders
        </h2>
        <div className="relative max-w-3xl mx-auto h-72 reveal">
          <FaQuoteLeft className="absolute top-0 left-0 text-8xl text-border-color/50 -z-10" />
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`absolute inset-0 flex flex-col justify-center items-center text-center p-4 transition-all duration-500 ease-in-out ${
                index === currentTestimonial
                  ? "opacity-100 translate-x-0"
                  : "opacity-0"
              } ${
                index < currentTestimonial ? "-translate-x-8" : "translate-x-8"
              }`}
            >
              <div className="flex gap-1 mb-6 text-yellow-400">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FaStar key={i} />
                ))}
              </div>
              <p className="text-xl md:text-2xl italic text-text-muted mb-6">
                "{testimonial.quote}"
              </p>
              <p className="font-semibold text-lg">- {testimonial.author}</p>
            </div>
          ))}
          <button
            onClick={prevTestimonial}
            className="absolute top-1/2 -translate-y-1/2 -left-12 text-2xl p-2 rounded-full hover:bg-secondary-bg transition-colors"
          >
            &lt;
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute top-1/2 -translate-y-1/2 -right-12 text-2xl p-2 rounded-full hover:bg-secondary-bg transition-colors"
          >
            &gt;
          </button>
        </div>
      </section>

      {/* --- Call to Action Section --- */}
      <section className="relative py-28 px-6 text-center bg-secondary-bg">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1511994294314-3c662760f3d5?auto=format&fit=crop&q=80&w=2670')",
          }}
        ></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 reveal">
            Ready to Join the Revolution?
          </h2>
          <p
            className="text-xl text-text-muted mb-8 reveal"
            style={{ transitionDelay: "100ms" }}
          >
            Schedule a free test ride today and feel the VOLT difference.
          </p>
          <button
            className="bg-primary text-black font-semibold px-10 py-4 rounded-full hover:bg-white hover:-translate-y-1 transform transition-all duration-300 text-lg shadow-lg shadow-primary/30 reveal"
            style={{ transitionDelay: "200ms" }}
          >
            Book a Test Ride
          </button>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer
        id="contact"
        className="bg-dark-bg text-text-muted py-16 px-6 md:px-12"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-2">VOLT</h3>
            <p className="max-w-xs">
              Ride the future. Experience freedom, power, and style on two
              wheels.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Products</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Apex
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Vortex
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Glide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Accessories
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Press
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary transition-colors">
                Facebook
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Instagram
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border-color text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} VOLT Bikes. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EVCoShipHomepage;
