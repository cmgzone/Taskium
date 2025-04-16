// Sample ads generator for testing

const sampleAds = [
  {
    title: "Welcome to TSK Platform",
    description: "Learn how to use all platform features and start mining your rewards today.",
    imageUrl: "/public/images/mining-rewards.svg",
    linkUrl: "/mining",
    active: true,
    priority: 10,
    isUserAd: false,
    displayDuration: 30,
    placement: ["dashboard"],
    targetAudience: ["new"],
    status: "approved",
    buttonText: "Start Mining"
  },
  {
    title: "Weekend Mining Boost",
    description: "Earn 25% more tokens during the weekend! Don't miss this opportunity.",
    imageUrl: "/public/images/weekend-boost.svg",
    linkUrl: "/mining",
    active: true,
    priority: 5,
    isUserAd: false,
    displayDuration: 20,
    placement: ["dashboard", "mining"],
    targetAudience: ["all"],
    status: "approved",
    buttonText: "Mine Now"
  },
  {
    title: "Blockchain Classes",
    description: "Learn blockchain technology with our expert-led courses.",
    imageUrl: "/public/images/blockchain-class.svg",
    linkUrl: "/marketplace",
    active: true,
    priority: 3,
    isUserAd: false,
    displayDuration: 25,
    placement: ["marketplace"],
    targetAudience: ["miners"],
    status: "approved",
    buttonText: "Enroll Now"
  },
  {
    title: "Referral Program",
    description: "Invite friends and earn 25 TSK tokens for each successful referral!",
    imageUrl: "/public/images/referral-bonus.svg",
    linkUrl: "/referrals",
    active: true,
    priority: 7,
    isUserAd: false,
    displayDuration: 20,
    placement: ["dashboard", "mining"],
    targetAudience: ["all"],
    status: "approved",
    buttonText: "Invite Friends"
  },
  {
    title: "TSK Token Launch",
    description: "Our token is now available on major exchanges. Start trading today!",
    imageUrl: "/public/images/token-launch.svg",
    linkUrl: "/marketplace",
    active: true,
    priority: 8,
    isUserAd: false,
    displayDuration: 30,
    placement: ["dashboard"],
    targetAudience: ["premium"],
    status: "approved",
    buttonText: "View Details"
  }
];

// Export the sample ads for use in the application
module.exports = { sampleAds };