import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600">
            We'd love to hear from you
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Get in Touch</CardTitle>
            <CardDescription className="text-base">
              We welcome feedback, new feature suggestions, and message us here for any issues you may be encountering
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">Email us at:</p>
              <a 
                href="mailto:contactdiverank@gmail.com"
                className="text-xl font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                contactdiverank@gmail.com
              </a>
            </div>
            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <p>✉️ Share your feedback and suggestions</p>
              <p>🔧 Report technical issues</p>
              <p>💡 Request new features</p>
              <p>❓ Ask questions about the platform</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            We typically respond within 24-48 hours
          </p>
        </div>
      </div>
    </div>
  );
}