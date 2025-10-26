import React, { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
// use your own icon import if react-icons is not available
import { GoArrowUpRight } from "react-icons/go";
import { Avatar, Dropdown } from "antd";
import { Link } from "react-router-dom";
import StarBorderButton from "./StarBorderButton";
import "./CardNav.css";

const CardNav = ({
  logo,
  logoAlt = "Logo",
  items,
  className = "",
  ease = "power3.out",
  baseColor = "#fff",
  menuColor,
  user = null,
  profileData = null,
  userMenuItems = [],
  onProfileClick,
  isAuthenticated = false, // Add isAuthenticated prop
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector(".card-nav-content");
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease,
    });

    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 },
      "-=0.1"
    );

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i) => (el) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""}`}
        style={{ backgroundColor: baseColor }}
      >
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
            style={{ color: menuColor || "#000" }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            {
              // Support string text, image URL, and React element/component
              typeof logo === "string" ? (
                // Check if it's an image URL or plain text
                logo.match(/\.(jpg|jpeg|png|gif|svg)$/i) ? (
                  <img src={logo} alt={logoAlt} className="logo" />
                ) : (
                  <div className="logo">{logo}</div>
                )
              ) : React.isValidElement(logo) ? (
                <span className="logo">{logo}</span>
              ) : logo ? (
                <span className="logo">{React.createElement(logo)}</span>
              ) : null
            }
          </div>

          {isAuthenticated && user ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={["hover"]}
            >
              <div
                className="nav-user-profile"
                onClick={onProfileClick}
                style={{ cursor: "pointer" }}
              >
                <Avatar
                  size={40}
                  src={profileData?.imageUrl || user.imageUrl}
                  className="nav-user-avatar"
                  style={{
                    border: "2px solid rgba(24, 144, 255, 0.5)",
                    backgroundColor: "#1890ff",
                  }}
                >
                  {profileData?.imageUrl || user.imageUrl
                    ? null
                    : (profileData?.fullName || user.fullName)?.charAt(0) ||
                      "U"}
                </Avatar>
              </div>
            </Dropdown>
          ) : (
            <Link to="/login">
              <StarBorderButton color="#40a9ff" speed="4s" thickness={2}>
                Get Started
              </StarBorderButton>
            </Link>
          )}
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => {
                  // If onClick is provided, render as clickable div
                  if (lnk.onClick) {
                    return (
                      <div
                        key={`${lnk.label}-${i}`}
                        className="nav-card-link"
                        onClick={lnk.onClick}
                        aria-label={lnk.ariaLabel}
                        style={{ cursor: "pointer" }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            lnk.onClick();
                          }
                        }}
                      >
                        <GoArrowUpRight
                          className="nav-card-link-icon"
                          aria-hidden="true"
                        />
                        {lnk.label}
                      </div>
                    );
                  }
                  // Otherwise render as normal anchor tag
                  return (
                    <a
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link"
                      href={lnk.href || "#"}
                      aria-label={lnk.ariaLabel}
                    >
                      <GoArrowUpRight
                        className="nav-card-link-icon"
                        aria-hidden="true"
                      />
                      {lnk.label}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
