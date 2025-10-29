import React from "react";
import ReviewService from "../review.service";

/**
 * Service Jobs Page Wrapper
 * This component wraps ReviewService and opens the Service Jobs tab by default
 */
const ServiceJobsPage = () => {
  return <ReviewService defaultTab="service-jobs" sidebarKey="service-jobs" />;
};

export default ServiceJobsPage;

