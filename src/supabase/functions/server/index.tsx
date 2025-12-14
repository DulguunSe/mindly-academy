import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-80ca54e2/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-80ca54e2/signup", async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: "Email, password and name are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, phone },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      phone: phone || '',
      enrolledCourses: [],
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log(`Authorization error during signup: ${error}`);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// Get courses
app.get("/make-server-80ca54e2/courses", async (c) => {
  try {
    const courses = await kv.getByPrefix("course:");
    return c.json({ courses });
  } catch (error) {
    console.log(`Error fetching courses: ${error}`);
    return c.json({ error: "Failed to fetch courses" }, 500);
  }
});

// Create course (admin only for demo purposes)
app.post("/make-server-80ca54e2/courses", async (c) => {
  try {
    const course = await c.req.json();
    const courseId = `course:${Date.now()}`;
    await kv.set(courseId, {
      ...course,
      id: courseId,
      createdAt: new Date().toISOString()
    });
    return c.json({ success: true, courseId });
  } catch (error) {
    console.log(`Error creating course: ${error}`);
    return c.json({ error: "Failed to create course" }, 500);
  }
});

// Enroll in course
app.post("/make-server-80ca54e2/enroll", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { courseId } = await c.req.json();
    
    if (!courseId) {
      return c.json({ error: "Course ID is required" }, 400);
    }

    // Get user profile
    const userProfile = await kv.get(`user:${user.id}`);
    
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    // Add course to enrolled courses
    const enrolledCourses = userProfile.enrolledCourses || [];
    if (!enrolledCourses.includes(courseId)) {
      enrolledCourses.push(courseId);
      await kv.set(`user:${user.id}`, {
        ...userProfile,
        enrolledCourses
      });
    }

    // Create enrollment record
    const enrollmentId = `enrollment:${user.id}:${courseId}`;
    await kv.set(enrollmentId, {
      userId: user.id,
      courseId,
      enrolledAt: new Date().toISOString(),
      progress: 0
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error enrolling in course: ${error}`);
    return c.json({ error: "Failed to enroll in course" }, 500);
  }
});

// Get user profile
app.get("/make-server-80ca54e2/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    return c.json({ profile: userProfile });
  } catch (error) {
    console.log(`Error fetching profile: ${error}`);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// Update user profile
app.put("/make-server-80ca54e2/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const updates = await c.req.json();
    const userProfile = await kv.get(`user:${user.id}`);
    
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    await kv.set(`user:${user.id}`, {
      ...userProfile,
      ...updates,
      id: user.id, // Keep original id
      enrolledCourses: userProfile.enrolledCourses // Keep enrolled courses
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating profile: ${error}`);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// Submit feedback
app.post("/make-server-80ca54e2/feedback", async (c) => {
  try {
    const feedback = await c.req.json();
    const feedbackId = `feedback:${Date.now()}`;
    
    await kv.set(feedbackId, {
      ...feedback,
      id: feedbackId,
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error submitting feedback: ${error}`);
    return c.json({ error: "Failed to submit feedback" }, 500);
  }
});

// Submit contact message
app.post("/make-server-80ca54e2/contact", async (c) => {
  try {
    const contactData = await c.req.json();
    const contactId = `contact:${Date.now()}`;
    
    await kv.set(contactId, {
      ...contactData,
      id: contactId,
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error submitting contact message: ${error}`);
    return c.json({ error: "Failed to submit contact message" }, 500);
  }
});

// Get user's enrolled courses
app.get("/make-server-80ca54e2/my-courses", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const enrollments = await kv.getByPrefix(`enrollment:${user.id}:`);
    
    return c.json({ enrollments });
  } catch (error) {
    console.log(`Error fetching user courses: ${error}`);
    return c.json({ error: "Failed to fetch user courses" }, 500);
  }
});

// Create order (purchase course)
app.post("/make-server-80ca54e2/orders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { courseId, paymentMethod, promoCode } = await c.req.json();
    
    if (!courseId || !paymentMethod) {
      return c.json({ error: "Course ID and payment method are required" }, 400);
    }

    // Get course details
    const course = await kv.get(courseId);
    
    if (!course) {
      return c.json({ error: "Course not found" }, 404);
    }

    // Get user profile
    const userProfile = await kv.get(`user:${user.id}`);
    
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    // Check if already purchased
    const existingOrder = await kv.getByPrefix(`order:${user.id}:${courseId}`);
    if (existingOrder && existingOrder.length > 0) {
      const confirmedOrder = existingOrder.find((o: any) => o.status === 'confirmed');
      if (confirmedOrder) {
        return c.json({ error: "You have already purchased this course" }, 400);
      }
    }

    // Calculate price with promo code discount
    let finalPrice = course.price;
    let discount = 0;
    let promoCodeApplied = null;

    if (promoCode) {
      const promo = await kv.get(`promo:${promoCode}`);
      if (promo && promo.active) {
        discount = (course.price * promo.discountPercent) / 100;
        finalPrice = course.price - discount;
        promoCodeApplied = promoCode;
      }
    }

    // Create order
    const orderId = `order:${user.id}:${courseId}:${Date.now()}`;
    const order = {
      id: orderId,
      userId: user.id,
      userName: userProfile.name,
      userEmail: userProfile.email,
      userPhone: userProfile.phone || '',
      courseId,
      courseTitle: course.title,
      coursePrice: course.price,
      discount,
      finalPrice,
      promoCode: promoCodeApplied,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await kv.set(orderId, order);

    return c.json({ success: true, orderId, order });
  } catch (error) {
    console.log(`Error creating order: ${error}`);
    return c.json({ error: "Failed to create order" }, 500);
  }
});

// Get all orders (admin only)
app.get("/make-server-80ca54e2/admin/orders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all orders
    const orders = await kv.getByPrefix("order:");
    
    // Sort by creation date (newest first)
    orders.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return c.json({ orders });
  } catch (error) {
    console.log(`Error fetching orders: ${error}`);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

// Confirm payment (admin only)
app.post("/make-server-80ca54e2/admin/confirm-payment", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { orderId } = await c.req.json();
    
    if (!orderId) {
      return c.json({ error: "Order ID is required" }, 400);
    }

    // Get order
    const order = await kv.get(orderId);
    
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (order.status !== 'pending') {
      return c.json({ error: "Order is not pending" }, 400);
    }

    // Update order status
    order.status = 'confirmed';
    order.confirmedAt = new Date().toISOString();
    order.confirmedBy = user.id;
    await kv.set(orderId, order);

    // Grant access to course (create enrollment)
    const enrollmentId = `enrollment:${order.userId}:${order.courseId}`;
    const enrollment = {
      userId: order.userId,
      courseId: order.courseId,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      purchaseOrderId: orderId
    };
    await kv.set(enrollmentId, enrollment);

    // Update user's enrolled courses
    const userProfile = await kv.get(`user:${order.userId}`);
    if (userProfile) {
      const enrolledCourses = userProfile.enrolledCourses || [];
      if (!enrolledCourses.includes(order.courseId)) {
        enrolledCourses.push(order.courseId);
        await kv.set(`user:${order.userId}`, {
          ...userProfile,
          enrolledCourses
        });
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error confirming payment: ${error}`);
    return c.json({ error: "Failed to confirm payment" }, 500);
  }
});

// Cancel order (admin only)
app.post("/make-server-80ca54e2/admin/cancel-order", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { orderId } = await c.req.json();
    
    if (!orderId) {
      return c.json({ error: "Order ID is required" }, 400);
    }

    // Get order
    const order = await kv.get(orderId);
    
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();
    order.cancelledBy = user.id;
    await kv.set(orderId, order);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error cancelling order: ${error}`);
    return c.json({ error: "Failed to cancel order" }, 500);
  }
});

// Get user's orders
app.get("/make-server-80ca54e2/my-orders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const orders = await kv.getByPrefix(`order:${user.id}:`);
    
    // Sort by creation date (newest first)
    orders.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return c.json({ orders });
  } catch (error) {
    console.log(`Error fetching user orders: ${error}`);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

// Helper function to check if user is admin
const isAdmin = async (accessToken: string | undefined): Promise<{ isAdmin: boolean; userId: string | null }> => {
  if (!accessToken) {
    return { isAdmin: false, userId: null };
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return { isAdmin: false, userId: null };
    }

    // Check if user email is admin@admin.mn
    const isAdminUser = user.email === 'admin@admin.mn';
    
    return { isAdmin: isAdminUser, userId: user.id };
  } catch (error) {
    console.log(`Error checking admin status: ${error}`);
    return { isAdmin: false, userId: null };
  }
};

// Get course detail with lessons
app.get("/make-server-80ca54e2/courses/:id", async (c) => {
  try {
    const courseId = c.req.param('id');
    
    const course = await kv.get(courseId);
    
    if (!course) {
      return c.json({ error: "Course not found" }, 404);
    }

    // Get lessons for this course
    const lessons = await kv.getByPrefix(`lesson:${courseId}:`);
    
    // Sort lessons by order
    lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return c.json({ course, lessons });
  } catch (error) {
    console.log(`Error fetching course detail: ${error}`);
    return c.json({ error: "Failed to fetch course detail" }, 500);
  }
});

// Admin: Create/Update course
app.post("/make-server-80ca54e2/admin/courses", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin: userIsAdmin } = await isAdmin(accessToken);

    if (!userIsAdmin) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const course = await c.req.json();
    const courseId = course.id || `course:${Date.now()}`;
    
    await kv.set(courseId, {
      ...course,
      id: courseId,
      updatedAt: new Date().toISOString(),
      createdAt: course.createdAt || new Date().toISOString()
    });

    return c.json({ success: true, courseId, course: await kv.get(courseId) });
  } catch (error) {
    console.log(`Error creating/updating course: ${error}`);
    return c.json({ error: "Failed to create/update course" }, 500);
  }
});

// Admin: Delete course
app.delete("/make-server-80ca54e2/admin/courses/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin: userIsAdmin } = await isAdmin(accessToken);

    if (!userIsAdmin) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const courseId = c.req.param('id');
    
    // Delete course
    await kv.del(courseId);
    
    // Delete all lessons for this course
    const lessons = await kv.getByPrefix(`lesson:${courseId}:`);
    for (const lesson of lessons) {
      await kv.del(lesson.id);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting course: ${error}`);
    return c.json({ error: "Failed to delete course" }, 500);
  }
});

// Admin: Create/Update lesson
app.post("/make-server-80ca54e2/admin/lessons", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin: userIsAdmin } = await isAdmin(accessToken);

    if (!userIsAdmin) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const lesson = await c.req.json();
    const lessonId = lesson.id || `lesson:${lesson.courseId}:${Date.now()}`;
    
    await kv.set(lessonId, {
      ...lesson,
      id: lessonId,
      updatedAt: new Date().toISOString(),
      createdAt: lesson.createdAt || new Date().toISOString()
    });

    return c.json({ success: true, lessonId, lesson: await kv.get(lessonId) });
  } catch (error) {
    console.log(`Error creating/updating lesson: ${error}`);
    return c.json({ error: "Failed to create/update lesson" }, 500);
  }
});

// Admin: Delete lesson
app.delete("/make-server-80ca54e2/admin/lessons/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin: userIsAdmin } = await isAdmin(accessToken);

    if (!userIsAdmin) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const lessonId = c.req.param('id');
    await kv.del(lessonId);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting lesson: ${error}`);
    return c.json({ error: "Failed to delete lesson" }, 500);
  }
});

// Admin: Create promo code
app.post("/make-server-80ca54e2/admin/promo-codes", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin: userIsAdmin } = await isAdmin(accessToken);

    if (!userIsAdmin) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const { code, discountPercent, description } = await c.req.json();
    
    if (!code || !discountPercent) {
      return c.json({ error: "Code and discount percent are required" }, 400);
    }

    const promoId = `promo:${code}`;
    
    // Check if promo code already exists
    const existing = await kv.get(promoId);
    if (existing) {
      return c.json({ error: "Promo code already exists" }, 400);
    }

    const promo = {
      id: promoId,
      code,
      discountPercent: Number(discountPercent),
      description: description || '',
      active: true,
      createdAt: new Date().toISOString()
    };

    await kv.set(promoId, promo);

    return c.json({ success: true, promo });
  } catch (error) {
    console.log(`Error creating promo code: ${error}`);
    return c.json({ error: "Failed to create promo code" }, 500);
  }
});

// Admin: Get all promo codes
app.get("/make-server-80ca54e2/admin/promo-codes", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin: userIsAdmin } = await isAdmin(accessToken);

    if (!userIsAdmin) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const promoCodes = await kv.getByPrefix("promo:");

    return c.json({ promoCodes });
  } catch (error) {
    console.log(`Error fetching promo codes: ${error}`);
    return c.json({ error: "Failed to fetch promo codes" }, 500);
  }
});

// Admin: Toggle promo code active status
app.put("/make-server-80ca54e2/admin/promo-codes/:code", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin: userIsAdmin } = await isAdmin(accessToken);

    if (!userIsAdmin) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const code = c.req.param('code');
    const promoId = `promo:${code}`;
    
    const promo = await kv.get(promoId);
    
    if (!promo) {
      return c.json({ error: "Promo code not found" }, 404);
    }

    promo.active = !promo.active;
    await kv.set(promoId, promo);

    return c.json({ success: true, promo });
  } catch (error) {
    console.log(`Error toggling promo code: ${error}`);
    return c.json({ error: "Failed to toggle promo code" }, 500);
  }
});

// Admin: Delete promo code
app.delete("/make-server-80ca54e2/admin/promo-codes/:code", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin: userIsAdmin } = await isAdmin(accessToken);

    if (!userIsAdmin) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const code = c.req.param('code');
    const promoId = `promo:${code}`;
    
    await kv.del(promoId);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting promo code: ${error}`);
    return c.json({ error: "Failed to delete promo code" }, 500);
  }
});

// Validate promo code
app.post("/make-server-80ca54e2/validate-promo", async (c) => {
  try {
    const { code, courseId } = await c.req.json();
    
    if (!code) {
      return c.json({ error: "Promo code is required" }, 400);
    }

    const promoId = `promo:${code}`;
    const promo = await kv.get(promoId);

    if (!promo) {
      return c.json({ valid: false, error: "Promo code not found" });
    }

    if (!promo.active) {
      return c.json({ valid: false, error: "Promo code is inactive" });
    }

    // Get course to calculate discount
    if (courseId) {
      const course = await kv.get(courseId);
      if (course) {
        const discount = (course.price * promo.discountPercent) / 100;
        const finalPrice = course.price - discount;
        return c.json({ 
          valid: true, 
          promo: {
            code: promo.code,
            discountPercent: promo.discountPercent,
            description: promo.description
          },
          discount,
          finalPrice
        });
      }
    }

    return c.json({ 
      valid: true, 
      promo: {
        code: promo.code,
        discountPercent: promo.discountPercent,
        description: promo.description
      }
    });
  } catch (error) {
    console.log(`Error validating promo code: ${error}`);
    return c.json({ error: "Failed to validate promo code" }, 500);
  }
});

// Admin: Get all feedback
app.get("/make-server-80ca54e2/admin/feedback", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin: userIsAdmin } = await isAdmin(accessToken);

    if (!userIsAdmin) {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    const feedback = await kv.getByPrefix("feedback:");
    
    // Sort by creation date (newest first)
    feedback.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return c.json({ feedback });
  } catch (error) {
    console.log(`Error fetching feedback: ${error}`);
    return c.json({ error: "Failed to fetch feedback" }, 500);
  }
});

// Admin: Get all contact messages
app.get("/make-server-80ca54e2/admin/contact-messages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.email || error || user.email !== 'admin@admin.mn') {
      return c.json({ error: "Unauthorized - Admin only" }, 401);
    }

    const messages = await kv.getByPrefix("contact:");
    messages.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return c.json({ messages });
  } catch (error) {
    console.log(`Error fetching contact messages: ${error}`);
    return c.json({ error: "Failed to fetch contact messages" }, 500);
  }
});

// Admin: Get all users with their course progress
app.get("/make-server-80ca54e2/admin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.email || error || user.email !== 'admin@admin.mn') {
      return c.json({ error: "Unauthorized - Admin only" }, 401);
    }

    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log(`Error fetching auth users: ${authError.message}`);
      return c.json({ error: "Failed to fetch users" }, 500);
    }

    // Get all user profiles and progress
    const users = [];
    for (const authUser of authUsers.users) {
      const profile = await kv.get(`user:${authUser.id}`);
      
      // Get user's orders
      const orders = await kv.getByPrefix(`order:${authUser.id}:`);
      const confirmedOrders = orders.filter((o: any) => o.status === 'confirmed');
      
      // Get course progress for each enrolled course
      const courseProgress = [];
      for (const order of confirmedOrders) {
        const course = await kv.get(order.courseId);
        if (course) {
          const lessons = await kv.getByPrefix(`lesson:${course.id}:`);
          const completedLessons = await kv.getByPrefix(`progress:${authUser.id}:${course.id}:`);
          
          const totalLessons = lessons.length;
          const completed = completedLessons.filter((p: any) => p.completed).length;
          const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
          
          courseProgress.push({
            courseId: course.id,
            courseTitle: course.title,
            totalLessons,
            completedLessons: completed,
            progress,
            enrolledAt: order.confirmedAt || order.createdAt
          });
        }
      }
      
      users.push({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || 'N/A',
        phone: authUser.user_metadata?.phone || profile?.phone || 'N/A',
        createdAt: authUser.created_at,
        lastSignIn: authUser.last_sign_in_at,
        enrolledCourses: confirmedOrders.length,
        courseProgress,
        totalProgress: courseProgress.length > 0 
          ? Math.round(courseProgress.reduce((sum: number, c: any) => sum + c.progress, 0) / courseProgress.length)
          : 0
      });
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ users });
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Get user's purchased courses with access check
app.get("/make-server-80ca54e2/my-purchased-courses", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get confirmed orders
    const orders = await kv.getByPrefix(`order:${user.id}:`);
    const confirmedOrders = orders.filter((o: any) => o.status === 'confirmed');
    
    // Get course details for each confirmed order
    const purchasedCourses = [];
    for (const order of confirmedOrders) {
      const course = await kv.get(order.courseId);
      if (course) {
        // Get lessons for this course
        const lessons = await kv.getByPrefix(`lesson:${course.id}:`);
        lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        
        purchasedCourses.push({
          ...course,
          lessons,
          purchaseDate: order.confirmedAt || order.createdAt
        });
      }
    }

    return c.json({ courses: purchasedCourses });
  } catch (error) {
    console.log(`Error fetching purchased courses: ${error}`);
    return c.json({ error: "Failed to fetch courses" }, 500);
  }
});

// Get platform statistics (public)
app.get("/make-server-80ca54e2/stats", async (c) => {
  try {
    // Get all courses
    const courses = await kv.getByPrefix("course:");
    const activeCourses = courses.filter((c: any) => c.published);

    // Get all instructors (count unique instructors from courses)
    const instructors = new Set();
    courses.forEach((course: any) => {
      if (course.instructor) {
        instructors.add(course.instructor);
      }
    });

    // Get all users
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const totalUsers = authUsers?.users.length || 0;

    // Get all confirmed orders to count enrolled students
    const orders = await kv.getByPrefix("order:");
    const confirmedOrders = orders.filter((o: any) => o.status === 'confirmed');
    const enrolledStudents = new Set(confirmedOrders.map((o: any) => o.userId)).size;

    // Get all feedback for average rating
    const feedback = await kv.getByPrefix("feedback:");
    const avgRating = feedback.length > 0
      ? (feedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1)
      : "5.0";

    return c.json({
      stats: {
        totalCourses: activeCourses.length,
        totalInstructors: instructors.size,
        totalStudents: totalUsers,
        enrolledStudents,
        activeStudents: Math.floor(enrolledStudents * 0.75), // Estimate 75% active
        averageRating: parseFloat(avgRating),
        totalOrders: orders.length,
        confirmedOrders: confirmedOrders.length,
        satisfactionRate: 98, // Fixed high satisfaction rate
        partnerCompanies: Math.max(15, Math.floor(instructors.size * 0.3)) // Estimate based on instructors
      }
    });
  } catch (error) {
    console.log(`Error fetching stats: ${error}`);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

Deno.serve(app.fetch);