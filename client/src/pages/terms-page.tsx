import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, FileText, ShieldCheck, BadgeInfo } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Terms & Policies</h1>
        <p className="text-muted-foreground mt-1">
          Important legal information about using the TSK Platform
        </p>
      </div>

      <Tabs defaultValue="terms" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Terms of Service
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Privacy Policy
          </TabsTrigger>
          <TabsTrigger value="disclaimer" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Disclaimers
          </TabsTrigger>
        </TabsList>

        {/* Terms of Service */}
        <TabsContent value="terms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Terms of Service
              </CardTitle>
              <CardDescription>Last updated: March 27, 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium">1. Acceptance of Terms</h3>
                    <p className="mt-2 text-sm">
                      By accessing or using the TSK Platform, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access or use our services.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">2. Description of Service</h3>
                    <p className="mt-2 text-sm">
                      TSK Platform is a decentralized ecosystem built on the BNB Smart Chain that provides token mining, marketplace, and advertising services. We offer various functionalities including but not limited to:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Token mining with daily activation requirements</li>
                      <li>Marketplace for digital goods and services</li>
                      <li>Advertising platform with targeting capabilities</li>
                      <li>Referral program with incentives</li>
                      <li>Premium membership options</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">3. Account Registration and Requirements</h3>
                    <p className="mt-2 text-sm">
                      To access certain features of the platform, you must register for an account. When you register, you agree to provide accurate, current, and complete information about yourself. You are responsible for safeguarding your password and for all activities that occur under your account.
                    </p>
                    <p className="mt-2 text-sm">
                      We reserve the right to suspend or terminate accounts that violate our terms or policies, or that we determine, in our sole discretion, are created for spam or abusive purposes.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">4. KYC Requirements</h3>
                    <p className="mt-2 text-sm">
                      For certain activities on the platform, including but not limited to token withdrawals above specified limits, you may be required to complete a Know Your Customer (KYC) verification process. This process involves submitting identification documents and personal information.
                    </p>
                    <p className="mt-2 text-sm">
                      Failure to complete KYC verification when required may result in limitations on your account functionality. We reserve the right to reject any KYC application that does not meet our requirements or appears fraudulent.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">5. Mining Rules and Limitations</h3>
                    <p className="mt-2 text-sm">
                      The TSK Platform offers token mining capabilities subject to the following conditions:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Mining requires daily activation within specified periods</li>
                      <li>Mining rates may vary based on membership level and platform conditions</li>
                      <li>Multiple accounts per user are not permitted</li>
                      <li>Automated mining or the use of bots is prohibited</li>
                      <li>Mining rewards are subject to change based on token economics</li>
                    </ul>
                    <p className="mt-2 text-sm">
                      Violation of mining rules may result in account suspension, forfeiture of mined tokens, or permanent banning from the platform.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">6. Marketplace Policies</h3>
                    <p className="mt-2 text-sm">
                      Users may buy, sell, or trade digital goods and services on the TSK Platform marketplace subject to the following conditions:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>All listings must comply with applicable laws and regulations</li>
                      <li>Prohibited items include illegal goods/services, counterfeit items, and harmful content</li>
                      <li>Sellers are responsible for the accuracy of their listings</li>
                      <li>Transaction fees may apply to marketplace transactions</li>
                      <li>Dispute resolution procedures are available for transaction issues</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">7. Advertising Rules</h3>
                    <p className="mt-2 text-sm">
                      The TSK Platform offers advertising opportunities subject to the following conditions:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>All advertisements must comply with our content guidelines</li>
                      <li>Ads must not contain misleading, deceptive, or harmful content</li>
                      <li>We reserve the right to reject or remove any advertisement at our discretion</li>
                      <li>Targeting options are provided as-is with no guarantee of specific performance metrics</li>
                      <li>Advertisers are responsible for ensuring their ads comply with applicable laws</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">8. Intellectual Property Rights</h3>
                    <p className="mt-2 text-sm">
                      The TSK Platform, including all content, features, and functionality, is owned by us, our licensors, or other providers and is protected by copyright, trademark, and other intellectual property laws.
                    </p>
                    <p className="mt-2 text-sm">
                      You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our platform without our express prior written consent.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">9. User Conduct</h3>
                    <p className="mt-2 text-sm">
                      You agree not to use the TSK Platform in any way that:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Violates any applicable law or regulation</li>
                      <li>Is harmful, fraudulent, deceptive, threatening, harassing, defamatory, obscene, or otherwise objectionable</li>
                      <li>Jeopardizes the security of your account or anyone else's account</li>
                      <li>Attempts to impersonate another user or person</li>
                      <li>Engages in any automated use of the system</li>
                      <li>Attempts to circumvent any content-filtering techniques we employ</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">10. Termination</h3>
                    <p className="mt-2 text-sm">
                      We may terminate or suspend your account and access to the TSK Platform immediately, without prior notice or liability, for any reason whatsoever, including, without limitation, if you breach these Terms of Service.
                    </p>
                    <p className="mt-2 text-sm">
                      Upon termination, your right to use the platform will immediately cease. If you wish to terminate your account, you may simply discontinue using the platform or request account deletion through the settings page.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">11. Limitation of Liability</h3>
                    <p className="mt-2 text-sm">
                      In no event shall TSK Platform, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Your access to or use of or inability to access or use the platform</li>
                      <li>Any conduct or content of any third party on the platform</li>
                      <li>Any content obtained from the platform</li>
                      <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">12. Changes to Terms</h3>
                    <p className="mt-2 text-sm">
                      We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                    </p>
                    <p className="mt-2 text-sm">
                      By continuing to access or use our platform after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the platform.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">13. Governing Law</h3>
                    <p className="mt-2 text-sm">
                      These Terms shall be governed and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.
                    </p>
                    <p className="mt-2 text-sm">
                      Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">14. Contact Us</h3>
                    <p className="mt-2 text-sm">
                      If you have any questions about these Terms, please contact us at support@tskplatform.com.
                    </p>
                  </section>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Policy */}
        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Privacy Policy
              </CardTitle>
              <CardDescription>Last updated: March 27, 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium">1. Introduction</h3>
                    <p className="mt-2 text-sm">
                      This Privacy Policy explains how TSK Platform collects, uses, stores, and protects your personal information. By using our platform, you consent to the data practices described in this policy.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">2. Information We Collect</h3>
                    <p className="mt-2 text-sm">
                      We collect several types of information from and about users of our platform, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li><strong>Personal Information:</strong> Email address, name, phone number, and other details you provide during registration or KYC verification</li>
                      <li><strong>Identity Verification Information:</strong> Government-issued ID documents, selfie verification, and address proof for KYC purposes</li>
                      <li><strong>Transaction Information:</strong> Data about your mining activities, marketplace transactions, and advertising campaigns</li>
                      <li><strong>Wallet Information:</strong> Public wallet addresses connected to your account</li>
                      <li><strong>Technical Data:</strong> IP address, browser type, device information, cookies, and usage statistics</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">3. How We Use Your Information</h3>
                    <p className="mt-2 text-sm">
                      We use your information for various purposes, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Providing and maintaining our platform services</li>
                      <li>Processing transactions and managing your account</li>
                      <li>Verifying your identity for KYC compliance</li>
                      <li>Preventing fraud and enhancing security</li>
                      <li>Improving and personalizing your experience</li>
                      <li>Communicating with you about updates, promotions, and support</li>
                      <li>Complying with legal obligations</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">4. Data Storage and Security</h3>
                    <p className="mt-2 text-sm">
                      We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                    <p className="mt-2 text-sm">
                      Your data is stored on secure servers and we use industry-standard encryption for data transmission. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">5. KYC Data Handling</h3>
                    <p className="mt-2 text-sm">
                      For KYC verification, we collect and process identification documents and personal information in compliance with applicable laws and regulations:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Your KYC data is encrypted and stored securely</li>
                      <li>Access to KYC information is strictly limited to authorized personnel</li>
                      <li>We retain KYC data for the period required by applicable regulations</li>
                      <li>We may use third-party KYC service providers who maintain comparable security standards</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">6. Sharing Your Information</h3>
                    <p className="mt-2 text-sm">
                      We may share your information with:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li><strong>Service Providers:</strong> Third parties that perform services on our behalf (payment processing, KYC verification, cloud hosting)</li>
                      <li><strong>Legal Authorities:</strong> When required by law, court order, or government regulation</li>
                      <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                    </ul>
                    <p className="mt-2 text-sm">
                      We do not sell your personal information to third parties.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">7. Cookies and Tracking</h3>
                    <p className="mt-2 text-sm">
                      We use cookies and similar tracking technologies to collect information about your browsing activities and to remember your preferences. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">8. Your Rights</h3>
                    <p className="mt-2 text-sm">
                      Depending on your location, you may have certain rights regarding your personal information, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Accessing and receiving a copy of your data</li>
                      <li>Rectifying inaccurate or incomplete information</li>
                      <li>Requesting deletion of your personal data</li>
                      <li>Restricting or objecting to certain processing activities</li>
                      <li>Data portability</li>
                      <li>Withdrawing consent</li>
                    </ul>
                    <p className="mt-2 text-sm">
                      To exercise these rights, please contact us through the support channels provided on our platform.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">9. Children's Privacy</h3>
                    <p className="mt-2 text-sm">
                      Our platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">10. Changes to This Privacy Policy</h3>
                    <p className="mt-2 text-sm">
                      We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">11. Contact Us</h3>
                    <p className="mt-2 text-sm">
                      If you have any questions about this Privacy Policy, please contact us at privacy@tskplatform.com.
                    </p>
                  </section>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disclaimers */}
        <TabsContent value="disclaimer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Legal Disclaimers
              </CardTitle>
              <CardDescription>Last updated: March 27, 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium">1. No Investment Advice</h3>
                    <p className="mt-2 text-sm">
                      The information provided on TSK Platform is for general informational purposes only and does not constitute financial, investment, or legal advice. We do not recommend any specific cryptocurrency, token, or investment strategy. Any decision to buy, sell, or hold TSK tokens or any other cryptocurrency should be made based on your own research and risk assessment.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">2. Risk Warning</h3>
                    <p className="mt-2 text-sm">
                      Cryptocurrency investments are volatile and high-risk. The value of TSK tokens and other cryptocurrencies can fluctuate significantly over short periods of time. You should only invest funds that you are willing to lose. Past performance is not indicative of future results.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">3. No Guarantees</h3>
                    <p className="mt-2 text-sm">
                      TSK Platform makes no guarantees regarding:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Token value or price stability</li>
                      <li>Mining rewards or rates</li>
                      <li>Platform availability or uptime</li>
                      <li>Future functionality or feature development</li>
                      <li>Marketplace transaction outcomes</li>
                      <li>Advertising campaign effectiveness</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">4. Third-Party Links</h3>
                    <p className="mt-2 text-sm">
                      Our platform may contain links to third-party websites, services, or content that are not owned or controlled by TSK Platform. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We do not endorse or guarantee the accuracy of any information provided by third parties.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">5. Tax Considerations</h3>
                    <p className="mt-2 text-sm">
                      Users are solely responsible for determining what, if any, taxes apply to their cryptocurrency transactions, mining rewards, marketplace activities, or other platform interactions. TSK Platform is not responsible for determining the taxes that may apply to your activities on our platform.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">6. Regulatory Compliance</h3>
                    <p className="mt-2 text-sm">
                      Blockchain and cryptocurrency regulations vary by jurisdiction and are evolving rapidly. Users are responsible for understanding and complying with all applicable laws in their jurisdiction. TSK Platform does not guarantee that its services are appropriate or available for use in any particular location.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">7. Network and Smart Contract Risks</h3>
                    <p className="mt-2 text-sm">
                      TSK tokens operate on the BNB Smart Chain blockchain network. The platform is subject to risks inherent to blockchain technology, including but not limited to:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Network congestion and high transaction fees</li>
                      <li>Blockchain forks or technical changes to the underlying protocol</li>
                      <li>Smart contract vulnerabilities or bugs</li>
                      <li>Private key security and wallet-related risks</li>
                      <li>Potential 51% attacks or other consensus vulnerabilities</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">8. Force Majeure</h3>
                    <p className="mt-2 text-sm">
                      TSK Platform shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, pandemic, civil unrest, government action, or computer/network/power failures.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">9. Limitation of Liability</h3>
                    <p className="mt-2 text-sm">
                      To the maximum extent permitted by law, TSK Platform and its affiliates, officers, employees, agents, partners and licensors shall not be liable for any direct, indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                      <li>Your access to or use of or inability to access or use the service</li>
                      <li>Any conduct or content of any third party on the service</li>
                      <li>Any content obtained from the service</li>
                      <li>Unauthorized access, use or alteration of your transmissions or content</li>
                      <li>Bugs, viruses, trojan horses, or the like that may be transmitted to or through our service</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">10. No Fiduciary Relationship</h3>
                    <p className="mt-2 text-sm">
                      Your use of TSK Platform does not create any fiduciary relationship between you and us. We are not your broker, intermediary, agent, or advisor and have no fiduciary relationship or obligation to you regarding any decisions or activities that you undertake on our platform.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-medium">11. Acknowledgment</h3>
                    <p className="mt-2 text-sm">
                      By using TSK Platform, you acknowledge that you have read, understood, and agree to these disclaimers. You further acknowledge the risks involved in cryptocurrency activities and accept full responsibility for your decisions and actions on our platform.
                    </p>
                  </section>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}