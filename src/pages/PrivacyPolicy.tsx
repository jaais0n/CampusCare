import { BackBar } from "@/components/BackBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Bell, UserCheck, Mail, Calendar } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <BackBar label="Back" to="/" desktopOnly />
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: November 27, 2025</p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-primary" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                CampusCare+ ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our campus 
                wellness platform.
              </p>
              <p>
                By using CampusCare+, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Name and email address</li>
                  <li>Student roll number and department</li>
                  <li>Phone number</li>
                  <li>Profile photo</li>
                  <li>Course information</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Health & Wellness Data</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Medical appointment details</li>
                  <li>Counseling session requests</li>
                  <li>Medicine orders</li>
                  <li>Wheelchair booking information</li>
                  <li>Emergency alerts and location data (when you use SOS)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Usage Information</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Device information and browser type</li>
                  <li>Access times and pages viewed</li>
                  <li>IP address (for security purposes)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-primary" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>We use the collected information for:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Processing and managing your health service appointments</li>
                <li>Facilitating medicine orders and wheelchair bookings</li>
                <li>Providing emergency assistance and location tracking during SOS alerts</li>
                <li>Connecting you with counseling services</li>
                <li>Sending appointment reminders and important notifications</li>
                <li>Improving our services and user experience</li>
                <li>Ensuring platform security and preventing fraud</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5 text-primary" />
                Data Protection & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure authentication using Supabase Auth</li>
                <li>Row-level security policies for database access</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data by authorized personnel only</li>
              </ul>
              <p className="mt-4">
                Your health information is treated with the highest level of confidentiality in accordance 
                with applicable healthcare privacy regulations.
              </p>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Information Sharing
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Campus Health Center:</strong> To process medical appointments</li>
                <li><strong>Counseling Services:</strong> To facilitate counseling sessions</li>
                <li><strong>Emergency Services:</strong> During SOS alerts for your safety</li>
                <li><strong>Campus Administration:</strong> For wheelchair and facility management</li>
              </ul>
              <p className="mt-4">
                We do not sell, trade, or rent your personal information to third parties for marketing purposes.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Access and view your personal data</li>
                <li>Update or correct your profile information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of non-essential notifications</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:privacy@campuscare.edu" className="text-primary hover:underline">
                  privacy@campuscare.edu
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Policy Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p>
                We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">Questions or Concerns?</h3>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                  <a href="mailto:privacy@campuscare.edu" className="text-primary hover:underline">
                    privacy@campuscare.edu
                  </a>
                  <span className="hidden sm:inline text-muted-foreground">|</span>
                  <span className="text-muted-foreground">Campus Health Center, Room 101</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
