import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage } from
"@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.
  string().
  trim().
  min(1, { message: "Нэрээ оруулна уу" }).
  max(100, { message: "Нэр хэт урт байна" }),
  email: z.
  string().
  trim().
  email({ message: "Зөв имэйл хаяг оруулна уу" }).
  max(255, { message: "Имэйл хэт урт байна" }),
  phone: z.
  string().
  trim().
  min(8, { message: "Утасны дугаар оруулна уу" }).
  max(20, { message: "Утасны дугаар хэт урт байна" }),
  message: z.
  string().
  trim().
  min(10, { message: "Мессеж хамгийн багадаа 10 тэмдэгт байх ёстой" }).
  max(1000, { message: "Мессеж хэт урт байна" })
});

type ContactFormValues = z.infer<typeof contactSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: ""
    }
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);

    // Simulate sending message
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Мессеж илгээгдлээ!",
      description: "Бид тантай удахгүй холбогдох болно."
    });

    form.reset();
    setIsSubmitting(false);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground py-16">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Холбоо барих
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Танд асуулт байна уу? Бидэнтэй холбогдоорой. Бид таны санал хүсэлтийг сонсоход бэлэн.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-card rounded-2xl p-8 shadow-lg border">
              <h2 className="text-2xl font-bold mb-6">Мессеж илгээх</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) =>
                    <FormItem>
                        <FormLabel>Нэр</FormLabel>
                        <FormControl>
                          <Input placeholder="Таны нэр" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    } />
                  

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) =>
                      <FormItem>
                          <FormLabel>Имэйл</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="example@mail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      } />
                    

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) =>
                      <FormItem>
                          <FormLabel>Утас</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="9912 3456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      } />
                    
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) =>
                    <FormItem>
                        <FormLabel>Мессеж</FormLabel>
                        <FormControl>
                          <Textarea
                          placeholder="Таны мессеж..."
                          className="min-h-[150px] resize-none"
                          {...field} />
                        
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    } />
                  

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}>
                    
                    {isSubmitting ?
                    "Илгээж байна..." :

                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Илгээх
                      </>
                    }
                  </Button>
                </form>
              </Form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Холбоо барих мэдээлэл</h2>
                <p className="text-muted-foreground mb-8">
                  Манай багтай холбогдохыг хүсвэл доорх мэдээллийг ашиглана уу. 
                  Бид ажлын цагаар таны хүсэлтэд хариу өгөх болно.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Хаяг</h3>
                    <p className="text-muted-foreground">
                      Улаанбаатар хот
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Утас</h3>
                    <p className="text-muted-foreground">
                      <a href="tel:+97699123456" className="hover:text-primary transition-colors">
                        +976 94651282 
                      </a>
                    </p>
                    <p className="text-muted-foreground">
                      <a href="tel:+97677123456" className="hover:text-primary transition-colors">
                        ​
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Имэйл</h3>
                    <p className="text-muted-foreground">
                      <a href="mailto:mindly.study" className="hover:text-primary transition-colors">
                        mindly.study
                      </a>
                    </p>
                    <p className="text-muted-foreground">
                      <a href="mailto:support@mindly.mn" className="hover:text-primary transition-colors">
                        support@mindly.study

                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Ажлын цаг</h3>
                    <p className="text-muted-foreground">
                      Даваа - Баасан: 09:00 - 18:00
                    </p>
                    <p className="text-muted-foreground">
                      Бямба: 10:00 - 15:00
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>);};

export default Contact;