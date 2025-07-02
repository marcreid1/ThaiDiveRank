import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SECURITY_QUESTIONS } from "@shared/securityQuestions";
import { Loader2, Eye, EyeOff, Shield, Edit } from "lucide-react";

interface SecurityQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserSecurityQuestions {
  questions: [string, string, string];
  answers: [string, string, string];
}

const securityUpdateSchema = z.object({
  question1: z.string().min(1, "Please select a security question"),
  answer1: z.string().min(1, "Please provide an answer"),
  question2: z.string().min(1, "Please select a security question"),
  answer2: z.string().min(1, "Please provide an answer"),
  question3: z.string().min(1, "Please select a security question"),
  answer3: z.string().min(1, "Please provide an answer"),
}).refine((data) => {
  const questions = [data.question1, data.question2, data.question3];
  return new Set(questions).size === questions.length;
}, {
  message: "Please select three different security questions",
  path: ["question1"],
});

type SecurityUpdateFormData = z.infer<typeof securityUpdateSchema>;

export function SecurityQuestionsDialog({ open, onOpenChange }: SecurityQuestionsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current security questions
  const { data: securityData, isLoading } = useQuery({
    queryKey: ["/api/auth/security-questions"],
    queryFn: getQueryFn<UserSecurityQuestions>({ on401: "throw" }),
    enabled: open,
  });

  const form = useForm<SecurityUpdateFormData>({
    resolver: zodResolver(securityUpdateSchema),
    defaultValues: {
      question1: "",
      answer1: "",
      question2: "",
      answer2: "",
      question3: "",
      answer3: "",
    },
  });

  // Update form when security data loads and editing mode changes
  useEffect(() => {
    if (securityData && isEditing) {
      form.reset({
        question1: securityData.questions[0],
        answer1: securityData.answers[0],
        question2: securityData.questions[1],
        answer2: securityData.answers[1],
        question3: securityData.questions[2],
        answer3: securityData.answers[2],
      });
    }
  }, [securityData, isEditing, form]);

  const updateSecurityMutation = useMutation({
    mutationFn: async (data: SecurityUpdateFormData) => {
      const response = await apiRequest("PUT", "/api/auth/security-questions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/security-questions"] });
      toast({
        title: "Security questions updated",
        description: "Your security questions have been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating security questions",
        description: error.message || "Failed to update security questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (securityData) {
      form.reset({
        question1: securityData.questions[0],
        answer1: securityData.answers[0],
        question2: securityData.questions[1],
        answer2: securityData.answers[1],
        question3: securityData.questions[2],
        answer3: securityData.answers[2],
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset();
  };

  const onSubmit = (data: SecurityUpdateFormData) => {
    updateSecurityMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Security Questions
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your security questions and answers. These are used for account recovery."
              : "View and manage your security questions. These are used for account recovery if you forget your password."
            }
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading security questions...</span>
          </div>
        ) : !securityData ? (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">
              No security questions found. Please contact support.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {!isEditing ? (
              // View Mode
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Your Security Questions</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAnswers(!showAnswers)}
                    >
                      {showAnswers ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Answers
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show Answers
                        </>
                      )}
                    </Button>
                    <Button onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Questions
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {securityData.questions.map((question, index) => (
                    <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="space-y-2">
                        <p className="font-medium text-sm text-slate-600 dark:text-slate-300">
                          Question {index + 1}:
                        </p>
                        <p className="text-slate-900 dark:text-white">
                          {question}
                        </p>
                        {showAnswers && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-600">
                            <p className="font-medium text-sm text-slate-600 dark:text-slate-300">
                              Your Answer:
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded italic">
                              [Hidden for security - use "Edit Questions" to modify]
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Edit Mode
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        Security Question {num}
                      </h4>
                      
                      <FormField
                        control={form.control}
                        name={`question${num}` as keyof SecurityUpdateFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a security question" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SECURITY_QUESTIONS.map((question) => (
                                  <SelectItem key={question} value={question}>
                                    {question}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`answer${num}` as keyof SecurityUpdateFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Answer</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                placeholder="Enter your answer"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateSecurityMutation.isPending}>
                      {updateSecurityMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Security Questions"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}