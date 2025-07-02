import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SECURITY_QUESTIONS } from "@shared/securityQuestions";

const securityQuestionsSchema = z.object({
  question1: z.string().min(1, "Please select a security question"),
  answer1: z.string().min(2, "Answer must be at least 2 characters").max(100, "Answer must be less than 100 characters"),
  question2: z.string().min(1, "Please select a security question"),
  answer2: z.string().min(2, "Answer must be at least 2 characters").max(100, "Answer must be less than 100 characters"),
  question3: z.string().min(1, "Please select a security question"),
  answer3: z.string().min(2, "Answer must be at least 2 characters").max(100, "Answer must be less than 100 characters"),
});

type SecurityQuestionsForm = z.infer<typeof securityQuestionsSchema>;

interface SecurityQuestionsProps {
  onSubmit: (data: SecurityQuestionsForm) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export default function SecurityQuestions({ 
  onSubmit, 
  isLoading = false, 
  title = "Set Up Security Questions",
  description = "Choose 3 security questions to help recover your account if you forget your password."
}: SecurityQuestionsProps) {
  const form = useForm<SecurityQuestionsForm>({
    resolver: zodResolver(securityQuestionsSchema),
    defaultValues: {
      question1: "",
      answer1: "",
      question2: "",
      answer2: "",
      question3: "",
      answer3: "",
    }
  });

  const selectedQuestions = [
    form.watch("question1"),
    form.watch("question2"), 
    form.watch("question3")
  ];

  const getAvailableQuestions = (currentIndex: number) => {
    return SECURITY_QUESTIONS.filter(question => {
      const isSelected = selectedQuestions.includes(question);
      const isCurrentSelection = selectedQuestions[currentIndex] === question;
      return !isSelected || isCurrentSelection;
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Question 1 */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="question1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Question 1</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableQuestions(0).map((question) => (
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
                name="answer1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Answer</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter your answer"
                        disabled={!form.watch("question1")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="question2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Question 2</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableQuestions(1).map((question) => (
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
                name="answer2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Answer</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter your answer"
                        disabled={!form.watch("question2")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Question 3 */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="question3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Question 3</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableQuestions(2).map((question) => (
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
                name="answer3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Answer</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter your answer"
                        disabled={!form.watch("question3")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Security Questions"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}