import { Info, Users, Zap, Shield, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AboutPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold tracking-tight">About TSK Platform</h1>
        <p className="text-muted-foreground mt-1">
          Learn more about the TSK Platform, our mission, and the team behind it
        </p>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8">
        {/* Mission Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Our Mission
            </CardTitle>
            <CardDescription>
              What drives the TSK Platform forward
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              At TSK Platform, our mission is to democratize access to blockchain technology and create a sustainable ecosystem that rewards active participation. We believe in building a community-driven platform where users can engage, learn, and earn through various activities.
            </p>
            <p>
              We're committed to transparency, security, and continuous innovation. Our platform is designed to bridge the gap between traditional advertising and blockchain technology, creating new opportunities for users and advertisers alike.
            </p>
          </CardContent>
        </Card>
        
        {/* Platform Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              What is TSK Platform?
            </CardTitle>
            <CardDescription>
              A brief overview of our ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              TSK Platform is a decentralized ecosystem built on the BNB Smart Chain that combines advertising, mining, and marketplace functionalities. Our platform offers various ways to engage and earn:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>Daily Mining:</strong> Activate mining to earn TSK tokens daily, with bonuses for referrals and premium memberships.
              </li>
              <li>
                <strong>Marketplace:</strong> Buy, sell, or trade digital goods and services using TSK tokens.
              </li>
              <li>
                <strong>Advertising:</strong> Create targeted ad campaigns to reach specific user segments within the platform.
              </li>
              <li>
                <strong>Referral Program:</strong> Invite friends and earn a 10% bonus on their mining rewards.
              </li>
              <li>
                <strong>Premium Memberships:</strong> Access exclusive features and enhanced mining rates.
              </li>
            </ul>
          </CardContent>
        </Card>
        
        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Our Technology
            </CardTitle>
            <CardDescription>
              The technology powering the TSK Platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              TSK Platform is built on modern, secure, and scalable technologies to ensure the best user experience:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/20 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Blockchain</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>BNB Smart Chain for low transaction fees</li>
                  <li>ERC-20 compatible smart contracts</li>
                  <li>Secure wallet integration</li>
                  <li>Transparent transaction history</li>
                </ul>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Web Application</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>React & TypeScript for a responsive UI</li>
                  <li>Progressive Web App capabilities</li>
                  <li>Real-time notifications</li>
                  <li>Adaptive design for all devices</li>
                </ul>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Security</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Secure authentication system</li>
                  <li>KYC verification for enhanced security</li>
                  <li>Regular security audits</li>
                  <li>Data encryption for sensitive information</li>
                </ul>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Infrastructure</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Cloud-based hosting for reliability</li>
                  <li>PostgreSQL database for data persistence</li>
                  <li>Automated backup systems</li>
                  <li>Scalable architecture for growth</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Meet the Team (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Meet the Team
            </CardTitle>
            <CardDescription>
              The people behind TSK Platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Team Member 1 */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
                </Avatar>
                <h3 className="font-medium">John Doe</h3>
                <p className="text-sm text-muted-foreground">Founder & CEO</p>
                <p className="text-xs mt-2">Blockchain enthusiast with 10+ years of experience in fintech and decentralized systems.</p>
              </div>
              
              {/* Team Member 2 */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarFallback className="bg-primary/10 text-primary">AS</AvatarFallback>
                </Avatar>
                <h3 className="font-medium">Alice Smith</h3>
                <p className="text-sm text-muted-foreground">CTO</p>
                <p className="text-xs mt-2">Smart contract developer and security expert with a background in distributed systems.</p>
              </div>
              
              {/* Team Member 3 */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarFallback className="bg-primary/10 text-primary">RJ</AvatarFallback>
                </Avatar>
                <h3 className="font-medium">Robert Johnson</h3>
                <p className="text-sm text-muted-foreground">Head of Marketing</p>
                <p className="text-xs mt-2">Digital marketing specialist with expertise in growth strategies for blockchain projects.</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                Our team is constantly growing! Interested in joining us? Check out our careers page (coming soon).
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Community */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Our Community
            </CardTitle>
            <CardDescription>
              Join thousands of users around the world
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The TSK Platform is powered by our vibrant community of users, miners, advertisers, and developers. We're committed to creating a platform that responds to the needs and feedback of our community.
            </p>
            <p>
              Join the conversation and stay updated with the latest news and developments:
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <a href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                <span className="text-primary">Telegram</span>
              </a>
              <a href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                <span className="text-primary">Discord</span>
              </a>
              <a href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                <span className="text-primary">Twitter</span>
              </a>
              <a href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                <span className="text-primary">Medium</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}