import { Mail, MessageSquare, HelpCircle, Bug, Lightbulb, Users, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [emailCopied, setEmailCopied] = useState(false);
  const { toast } = useToast();

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("contactdiverank@gmail.com");
      setEmailCopied(true);
      toast({
        title: "Email Copied!",
        description: "The email address has been copied to your clipboard.",
      });
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the email address.",
        variant: "destructive",
      });
    }
  };

  const contactReasons = [
    {
      icon: Bug,
      title: "Report Issues",
      description: "Found a bug or technical problem? Let us know so we can fix it quickly.",
      color: "text-red-500 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/30",
    },
    {
      icon: Lightbulb,
      title: "Feature Ideas",
      description: "Have an idea to improve DiveRank? We'd love to hear your suggestions.",
      color: "text-yellow-500 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    },
    {
      icon: HelpCircle,
      title: "Get Help",
      description: "Need assistance with your account or using the platform? We're here to help.",
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      icon: MessageSquare,
      title: "General Feedback",
      description: "Share your thoughts about dive sites, rankings, or your overall experience.",
      color: "text-green-500 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl"></div>
          </div>
          <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Mail className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 sm:text-5xl mb-4">
          Contact Us
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          We'd love to hear your feedback, feature ideas, and help resolve any issues you're experiencing.
        </p>
      </div>

      {/* Contact Reasons Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {contactReasons.map((reason, index) => {
          const IconComponent = reason.icon;
          return (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 ${reason.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`w-6 h-6 ${reason.color}`} />
                </div>
                <CardTitle className="text-lg">{reason.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {reason.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Contact Card */}
      <Card className="max-w-3xl mx-auto shadow-xl border-2 border-gradient">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Get in Touch</CardTitle>
          <CardDescription className="text-lg">
            Send us a message and we'll get back to you as soon as possible
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 uppercase tracking-wide">
              Email us at
            </p>
            
            <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
              <a 
                href="mailto:contactdiverank@gmail.com"
                className="text-2xl lg:text-3xl font-bold text-primary hover:text-primary/80 transition-colors duration-300 break-all"
              >
                contactdiverank@gmail.com
              </a>
              
              <Button
                variant="outline"
                size="sm"
                onClick={copyEmail}
                className="shrink-0 hover:bg-primary hover:text-white transition-all duration-300"
              >
                {emailCopied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <a href="mailto:contactdiverank@gmail.com">
                <Mail className="w-5 h-5 mr-2" />
                Send Email
              </a>
            </Button>
          </div>
          
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>
              💡 <strong>Tip:</strong> Include "DiveRank" in your subject line for faster response times
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Response Time Info */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-6 py-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            We typically respond within 24-48 hours
          </span>
        </div>
      </div>
    </main>
  );
}