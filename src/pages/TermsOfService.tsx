import { BackBar } from "@/components/BackBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, AlertTriangle, Users, Shield, Scale, Clock, HelpCircle } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <BackBar label="Back" to="/" desktopOnly />
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: November 27, 2025</p>
        </div>

        <div className="space-y-6">
          {/* Acceptance */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-primary" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                By accessing or using CampusCare+ ("the Platform"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Platform.
              </p>
              <p>
                CampusCare+ is a campus wellness platform designed to connect students and staff with essential 
                health services, emergency support, and wellness programs.
              </p>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>To use CampusCare+, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Be a registered student, faculty member, or staff of the institution</li>
                <li>Have a valid institutional email address</li>
                <li>Be at least 18 years old, or have parental/guardian consent</li>
                <li>Provide accurate and complete registration information</li>
              </ul>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Services Provided
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>CampusCare+ offers the following services:</p>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Medical Appointments</h4>
                <p className="ml-2">Schedule and manage appointments with campus health center medical professionals.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Counseling Services</h4>
                <p className="ml-2">Book confidential counseling sessions with licensed counselors.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Medicine Orders</h4>
                <p className="ml-2">Order prescribed and over-the-counter medications from the campus pharmacy.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Wheelchair Services</h4>
                <p className="ml-2">Request wheelchair assistance for temporary mobility needs on campus.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Emergency SOS</h4>
                <p className="ml-2">Access emergency assistance with real-time location sharing for immediate help.</p>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-primary" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>As a user of CampusCare+, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Provide accurate and truthful information in all forms and communications</li>
                <li>Keep your account credentials secure and confidential</li>
                <li>Use the emergency SOS feature only for genuine emergencies</li>
                <li>Attend scheduled appointments or cancel with reasonable notice</li>
                <li>Respect healthcare providers and other users</li>
                <li>Not misuse or attempt to manipulate the Platform</li>
                <li>Report any bugs, security issues, or misuse to the administration</li>
              </ul>
            </CardContent>
          </Card>

          {/* Prohibited Conduct */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Prohibited Conduct
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>The following activities are strictly prohibited:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Making false emergency alerts or misusing the SOS system</li>
                <li>Impersonating another user or providing false identity information</li>
                <li>Attempting to access other users' accounts or personal data</li>
                <li>Booking appointments with no intention of attending</li>
                <li>Ordering medications for non-personal use or resale</li>
                <li>Harassing healthcare providers or other users</li>
                <li>Attempting to hack, disrupt, or damage the Platform</li>
                <li>Using the Platform for any illegal activities</li>
              </ul>
              <p className="mt-4 text-destructive">
                Violation of these terms may result in account suspension or termination and may be 
                reported to campus authorities.
              </p>
            </CardContent>
          </Card>

          {/* Medical Disclaimer */}
          <Card className="bg-destructive/10 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Medical Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                <strong className="text-foreground">Important:</strong> CampusCare+ is a scheduling and 
                coordination platform, not a medical provider. The Platform:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Does not provide medical advice, diagnosis, or treatment</li>
                <li>Should not be used as a substitute for professional medical consultation</li>
                <li>Is not intended for life-threatening emergencies — call local emergency services (911) immediately</li>
              </ul>
              <p className="mt-4">
                Always seek the advice of qualified healthcare providers with any questions regarding 
                medical conditions.
              </p>
            </CardContent>
          </Card>

          {/* Service Availability */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Service Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                We strive to maintain high availability of the Platform, but we do not guarantee 
                uninterrupted access. Services may be temporarily unavailable due to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Scheduled maintenance and updates</li>
                <li>Technical issues or system failures</li>
                <li>Circumstances beyond our control</li>
              </ul>
              <p className="mt-4">
                Health center operating hours and staff availability may vary. Please check the 
                Platform for current schedules.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                To the maximum extent permitted by law, CampusCare+ and its affiliates shall not be 
                liable for any indirect, incidental, special, or consequential damages arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Use or inability to use the Platform</li>
                <li>Any errors or omissions in content</li>
                <li>Unauthorized access to your data</li>
                <li>Service interruptions or delays</li>
              </ul>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Changes to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                We reserve the right to modify these Terms of Service at any time. Changes will be 
                effective immediately upon posting to the Platform.
              </p>
              <p>
                Your continued use of CampusCare+ after any changes indicates your acceptance of the 
                updated terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="h-5 w-5 text-primary" />
                Questions?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                  <a href="mailto:support@campuscare.edu" className="text-primary hover:underline">
                    support@campuscare.edu
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

export default TermsOfService;
