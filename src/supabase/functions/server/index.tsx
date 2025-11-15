import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Admin credentials (hardcoded as per requirements)
const ADMIN_EMAIL = 'shazzadmail1@gmail.com';
const ADMIN_PASSWORD = 'shazbrick110'; // In production, this should be hashed

// Helper function to verify user token (session-based)
async function verifyUserToken(sessionToken: string) {
  try {
    console.log('Verifying user session token...');
    
    // Get session data from KV store
    const sessionData = await kv.get(`session:${sessionToken}`);
    
    if (!sessionData) {
      console.error('Session not found in KV store');
      return null;
    }
    
    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - new Date(sessionData.createdAt).getTime();
    if (sessionAge > 24 * 60 * 60 * 1000) {
      console.error('Session expired');
      await kv.del(`session:${sessionToken}`);
      return null;
    }
    
    console.log('Session valid for user:', sessionData.userId);
    
    // Get user data from KV store
    const userData = await kv.get(`user:${sessionData.userId}`);
    if (!userData) {
      console.error('User data not found in KV store for user:', sessionData.userId);
      return null;
    }
    
    console.log('User data retrieved - Email:', userData.email);
    return { ...userData, id: sessionData.userId, accessToken: sessionToken };
  } catch (error) {
    console.error('Error verifying user token:', error);
    return null;
  }
}

// Helper function to verify admin token
async function verifyAdminToken(accessToken: string) {
  const adminData = await kv.get(`admin:${accessToken}`);
  return adminData || null;
}

// Helper function to create notification
async function createNotification(userId: string, type: string, message: string, reportId: string, actionUserId?: string, actionId?: string) {
  const notificationId = crypto.randomUUID();
  await kv.set(`notification:${notificationId}`, {
    id: notificationId,
    userId,
    type,
    message,
    reportId,
    actionUserId, // ID of the user who performed the action (for found/claim notifications)
    actionId, // ID of the action (for opening chat)
    read: false,
    createdAt: new Date().toISOString(),
  });
  
  // Add to user's notification list
  const userNotifications = await kv.get(`user-notifications:${userId}`) || [];
  userNotifications.unshift(notificationId);
  await kv.set(`user-notifications:${userId}`, userNotifications);
}


// Health check endpoint
app.get('/make-server-c95fd11c/health', (c) => {
  return c.json({ status: 'ok', message: 'Server is running' });
});

// Verify Identity for Password Reset
app.post('/make-server-c95fd11c/verify-identity', async (c) => {
  try {
    const { email, userId, userType } = await c.req.json();

    // Get user ID from email
    const userIdFromEmail = await kv.get(`user-email:${email}`);
    if (!userIdFromEmail) {
      return c.json({ error: 'No account found with this email' }, 404);
    }

    // Get user data
    const userData = await kv.get(`user:${userIdFromEmail}`);
    if (!userData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Verify user type and ID match
    if (userData.userType !== userType) {
      return c.json({ error: 'Account type does not match' }, 400);
    }

    if (userData.userId !== userId) {
      return c.json({ error: 'Identity verification failed. Incorrect ID/Code.' }, 400);
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    await kv.set(`reset-token:${resetToken}`, {
      userId: userIdFromEmail,
      email,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    });

    return c.json({ resetToken });
  } catch (error) {
    console.error('Verify identity error:', error);
    return c.json({ error: 'Identity verification failed' }, 500);
  }
});

// Reset Password
app.post('/make-server-c95fd11c/reset-password', async (c) => {
  try {
    const { resetToken, newPassword } = await c.req.json();

    // Verify reset token
    const tokenData = await kv.get(`reset-token:${resetToken}`);
    if (!tokenData) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    // Check if token expired
    if (new Date(tokenData.expiresAt) < new Date()) {
      await kv.del(`reset-token:${resetToken}`);
      return c.json({ error: 'Reset token has expired' }, 400);
    }

    // Get user data
    const userData = await kv.get(`user:${tokenData.userId}`);
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update password in Supabase Auth
    const { error } = await supabase.auth.admin.updateUserById(
      tokenData.userId,
      { password: newPassword }
    );

    if (error) {
      console.error('Supabase password update error:', error);
      return c.json({ error: 'Failed to update password' }, 500);
    }

    // Delete reset token
    await kv.del(`reset-token:${resetToken}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Password reset failed' }, 500);
  }
});

// User Registration
app.post('/make-server-c95fd11c/register', async (c) => {
  try {
    const { name, email, userId, department, phone, password, userType } = await c.req.json();

    // Validate email format
    const emailRegex = userType === 'student' 
      ? /^\d{11}@[a-z]{3}\.bubt\.edu\.bd$/
      : /^[a-zA-Z0-9]+@bubt\.edu\.bd$/;
    
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Validate University ID for students (must be 11 digits)
    if (userType === 'student') {
      if (!/^\d{11}$/.test(userId)) {
        return c.json({ error: 'University ID must be exactly 11 digits' }, 400);
      }

      // Validate department
      const validDepartments = ['cse', 'bba', 'eng', 'eco', 'mat', 'eee', 'civ', 'tex'];
      if (!department || !validDepartments.includes(department)) {
        return c.json({ error: 'Invalid department' }, 400);
      }

      // Validate email matches userId and department
      const expectedEmail = `${userId}@${department}.bubt.edu.bd`;
      if (email !== expectedEmail) {
        return c.json({ error: `Email must be ${expectedEmail}` }, 400);
      }
    }

    // Check if user already exists
    const existingUser = await kv.get(`user-email:${email}`);
    if (existingUser) {
      return c.json({ error: 'User already exists with this email' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { 
        name, 
        userType, 
        userId, 
        department: userType === 'student' ? department : undefined,
        phone,
        display_name: name,
        full_name: name,
        university_id: userId,
        user_type: userType,
      },
      phone,
    });

    if (error) {
      console.error('Supabase auth error during registration:', error);
      return c.json({ error: error.message }, 400);
    }

    const user = data.user;

    // Store user data in KV
    const userData = {
      name,
      email,
      userId,
      department: userType === 'student' ? department : undefined,
      phone,
      userType,
      banned: false,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`user:${user.id}`, userData);
    await kv.set(`user-email:${email}`, user.id);

    // Create session token
    const sessionToken = crypto.randomUUID();
    await kv.set(`session:${sessionToken}`, {
      userId: user.id,
      createdAt: new Date().toISOString(),
    });

    console.log('User registered successfully:', user.id, email);

    return c.json({
      user: {
        id: user.id,
        name,
        email,
        userType,
        userId,
        phone,
        accessToken: sessionToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// User Login
app.post('/make-server-c95fd11c/login', async (c) => {
  try {
    const { email, password, userType, needsLookup } = await c.req.json();
    
    let finalEmail = email;
    
    // If needsLookup is true, this means student entered just their ID
    // We need to find their full email with department
    if (needsLookup && userType === 'student') {
      // Search for user with this university ID
      const validDepartments = ['cse', 'bba', 'eng', 'eco', 'mat', 'eee', 'civ', 'tex'];
      let foundEmail = null;
      
      // Try each department to find the matching email
      for (const dept of validDepartments) {
        const testEmail = `${email}@${dept}.bubt.edu.bd`;
        const userId = await kv.get(`user-email:${testEmail}`);
        if (userId) {
          foundEmail = testEmail;
          break;
        }
      }
      
      if (!foundEmail) {
        console.error('University ID not found:', email);
        return c.json({ error: 'Invalid credentials' }, 401);
      }
      
      finalEmail = foundEmail;
      console.log('Found email for university ID:', email, '->', finalEmail);
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: finalEmail,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = data.user;
    const userData = await kv.get(`user:${user.id}`);

    if (!userData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Check if user is banned
    if (userData.banned) {
      return c.json({ error: 'Your account has been banned. Please contact admin.' }, 403);
    }

    // Validate userType matches the stored userType
    if (userData.userType !== userType) {
      console.error('Login role mismatch:', `Stored: ${userData.userType}, Attempted: ${userType}`);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Create session token
    const sessionToken = crypto.randomUUID();
    await kv.set(`session:${sessionToken}`, {
      userId: user.id,
      createdAt: new Date().toISOString(),
    });

    console.log('User logged in successfully:', user.id, userData.email);

    return c.json({
      user: {
        id: user.id,
        name: userData.name,
        email: userData.email,
        userType: userData.userType,
        userId: userData.userId,
        phone: userData.phone,
        accessToken: sessionToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Admin Login
app.post('/make-server-c95fd11c/admin-login', async (c) => {
  try {
    console.log('Admin login attempt received');
    const body = await c.req.json();
    const { email, password } = body;
    console.log('Admin login email:', email);

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      console.log('Invalid admin credentials');
      return c.json({ error: 'Invalid admin credentials' }, 401);
    }

    console.log('Admin credentials valid, generating token');
    const adminToken = crypto.randomUUID();
    await kv.set(`admin:${adminToken}`, {
      email: ADMIN_EMAIL,
      createdAt: new Date().toISOString(),
    });

    console.log('Admin login successful');
    return c.json({
      admin: {
        id: 'admin',
        email: ADMIN_EMAIL,
        accessToken: adminToken,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return c.json({ error: 'Admin login failed' }, 500);
  }
});

// Forgot Password - DISABLED (Display only in frontend)
app.post('/make-server-c95fd11c/forgot-password', async (c) => {
  // Feature disabled - display only mode
  return c.json({ error: 'Password reset feature is currently disabled' }, 503);
  
  /* reset token feature. temporary. পরে ইমপ্লিমেন্ট করবো।
  try {
    const { email } = await c.req.json();

    console.log('Password reset requested for:', email);

    // Check if user exists in KV store
    const userId = await kv.get(`user-email:${email}`);
    
    if (!userId) {
      // Don't reveal if email exists or not for security
      console.log('Email not found in database:', email);
      return c.json({ message: 'If the email exists, a reset token has been generated' });
    }

    // Get user data to retrieve their Supabase Auth ID
    const userData = await kv.get(`user:${userId}`);
    if (!userData) {
      console.log('User data not found for userId:', userId);
      return c.json({ message: 'If the email exists, a reset token has been generated' });
    }

    // Generate a secure reset token (6-digit code for simplicity)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Store the reset token in KV store with expiration
    // Note: userId here is actually the Supabase Auth ID (user.id from registration)
    await kv.set(`password-reset:${resetToken}`, {
      authId: userId, // This is the Supabase Auth ID
      email: email,
      expiresAt: resetTokenExpiry,
      createdAt: new Date().toISOString(),
    });

    // Also store by email for easy lookup
    await kv.set(`password-reset-email:${email}`, resetToken);

    console.log('Password reset token generated for:', email);
    
    // Send email with token using Resend API
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      console.log('Attempting to send email via Resend...');
      console.log('RESEND_API_KEY present:', resendApiKey ? 'Yes (length: ' + resendApiKey.length + ')' : 'No');
      
      if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured');
        return c.json({ error: 'Email service not configured. Please configure RESEND_API_KEY.' }, 500);
      }

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'UniFind BUBT <onboarding@resend.dev>',
          to: [email],
          subject: 'UniFind - Password Reset Token',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🔐 UniFind Password Reset</h1>
                  </div>
                  <div style="padding: 40px 30px;">
                    <p style="margin-top: 0;">Hello,</p>
                    <p>You requested to reset your password for your UniFind account at <strong>Bangladesh University of Business and Technology (BUBT)</strong>.</p>
                    
                    <p>Your password reset token is:</p>
                    
                    <div style="background: linear-gradient(135deg, #eef2ff 0%, #fae8ff 100%); border: 2px solid #a78bfa; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                      <div style="font-size: 42px; font-weight: bold; color: #6366f1; letter-spacing: 8px; font-family: 'Courier New', monospace;">${resetToken}</div>
                    </div>
                    
                    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">⏱️ <strong>This token expires in 15 minutes.</strong> Please use it immediately to reset your password.</p>
                    </div>
                    
                    <p><strong>How to reset your password:</strong></p>
                    <ol>
                      <li>Go to the UniFind login page</li>
                      <li>Click "Forgot Password?"</li>
                      <li>Enter this 6-digit token: <strong>${resetToken}</strong></li>
                      <li>Enter your new password</li>
                      <li>Submit the form</li>
                    </ol>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                    </p>
                  </div>
                  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 5px 0; color: #6b7280; font-size: 12px;"><strong>UniFind - Lost & Found System</strong></p>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">Bangladesh University of Business and Technology (BUBT)</p>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error('Failed to send email via Resend. Status:', emailResponse.status);
        console.error('Resend API response:', JSON.stringify(emailData, null, 2));
        console.error('Email details - To:', email, 'Token:', resetToken);
        throw new Error(`Failed to send email: ${JSON.stringify(emailData)}`);
      }

      console.log('Password reset email sent successfully to:', email);
      console.log('Resend response:', emailData);
      
      return c.json({ 
        message: 'A password reset token has been sent to your email address. Please check your inbox.',
        success: true
      });
    } catch (emailError) {
      console.error('Email sending error details:', {
        error: emailError,
        message: emailError.message,
        stack: emailError.stack,
        email: email,
      });
      
      // FALLBACK: If email fails, return the token directly
      // This allows the system to work even if email service is not configured
      console.log('Falling back to direct token display due to email error');
      return c.json({ 
        message: 'Email service temporarily unavailable. Here is your reset token:',
        success: true,
        token: resetToken,
        fallbackMode: true,
        expiresIn: '15 minutes'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ error: 'Failed to process password reset request' }, 500);
  }
  */
});

// Reset Password - DISABLED (Display only in frontend)
app.post('/make-server-c95fd11c/reset-password', async (c) => {
  // Feature disabled - display only mode
  return c.json({ error: 'Password reset feature is currently disabled' }, 503);
  
  /* DISABLED CODE
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      return c.json({ error: 'Reset token and new password are required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Verify the reset token
    const resetData = await kv.get(`password-reset:${token}`);
    
    if (!resetData) {
      console.error('Invalid reset token:', token);
      return c.json({ error: 'Invalid or expired reset token' }, 401);
    }

    console.log('Reset token found for email:', resetData.email, 'authId:', resetData.authId);

    // Check if token has expired
    const expiresAt = new Date(resetData.expiresAt);
    if (expiresAt < new Date()) {
      console.error('Reset token expired:', token);
      // Clean up expired token
      await kv.del(`password-reset:${token}`);
      await kv.del(`password-reset-email:${resetData.email}`);
      return c.json({ error: 'Reset token has expired. Please request a new one.' }, 401);
    }

    // Update password using service role key
    console.log('Attempting to update password for authId:', resetData.authId);
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetData.authId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password for authId:', resetData.authId, 'Error:', updateError);
      return c.json({ error: `Failed to update password: ${updateError.message}` }, 500);
    }

    // Clean up used token
    await kv.del(`password-reset:${token}`);
    await kv.del(`password-reset-email:${resetData.email}`);

    console.log('Password updated successfully for user:', resetData.authId);
    return c.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
  */
});

// ===== REPORT ROUTES =====

// Create Report
app.post('/make-server-c95fd11c/create-report', async (c) => {
  try {
    // Use custom header to avoid Supabase's automatic JWT validation
    const sessionToken = c.req.header('X-Session-Token');
    console.log('Create report - Session token:', sessionToken ? 'Present' : 'Missing');
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      console.error('Create report - User verification failed');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Create report - User verified:', user.id, user.email);

    // Parse multipart form data
    let formData;
    try {
      formData = await c.req.formData();
    } catch (parseError) {
      console.error('Create report - FormData parse error:', parseError);
      return c.json({ error: 'Failed to parse form data' }, 400);
    }

    const type = formData.get('type') as string;
    const itemName = formData.get('itemName') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const location = formData.get('location') as string || '';
    const photo = formData.get('photo') as File | null;

    console.log('Create report - Form data:', { type, itemName, category, date, location, hasPhoto: !!photo });

    // Validate required fields
    if (!type || !itemName || !category || !description || !date) {
      console.error('Create report - Missing required fields');
      return c.json({ error: 'Missing required fields' }, 400);
    }

    let photoUrl = '';
    
    // Handle photo upload if provided
    if (photo) {
      console.log('Create report - Uploading photo:', photo.name, 'size:', photo.size, 'type:', photo.type);
      
      try {
        const fileName = `${crypto.randomUUID()}-${photo.name}`;
        const arrayBuffer = await photo.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        console.log('Create report - Attempting upload to bucket: make-c95fd11c-reports');

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('make-c95fd11c-reports')
          .upload(fileName, bytes, {
            contentType: photo.type,
          });

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          return c.json({ error: `Failed to upload photo: ${uploadError.message}` }, 500);
        }
        
        console.log('Create report - Photo uploaded successfully:', uploadData);
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('make-c95fd11c-reports')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
        console.log('Create report - Photo URL:', photoUrl);
      } catch (uploadError: any) {
        console.error('Create report - Photo upload exception:', uploadError);
        return c.json({ error: `Failed to upload photo: ${uploadError.message}` }, 500);
      }
    }

    const reportId = crypto.randomUUID();
    const report = {
      id: reportId,
      type,
      itemName,
      category,
      description,
      date,
      location,
      photoUrl,
      status: 'pending',
      createdBy: user.id,
      creatorName: user.name,
      creatorEmail: user.email,
      createdAt: new Date().toISOString(),
    };

    console.log('Create report - Saving report to KV:', reportId);
    await kv.set(`report:${reportId}`, report);

    // Add to pending reports list
    const pendingReports = await kv.get('reports:pending') || [];
    console.log('Create report - Current pending reports:', pendingReports.length);
    pendingReports.unshift(reportId);
    await kv.set('reports:pending', pendingReports);
    console.log('Create report - Updated pending reports count:', pendingReports.length);

    // Add to user's reports
    const userReports = await kv.get(`user-reports:${user.id}`) || [];
    userReports.unshift(reportId);
    await kv.set(`user-reports:${user.id}`, userReports);

    console.log('Create report - SUCCESS! Report ID:', reportId);
    return c.json({ success: true, reportId });
  } catch (error: any) {
    console.error('Create report error:', error);
    console.error('Error stack:', error.stack);
    return c.json({ error: `Failed to create report: ${error.message}` }, 500);
  }
});

// Get Reports (with status filter)
app.get('/make-server-c95fd11c/reports', async (c) => {
  try {
    // Use custom header to avoid Supabase's automatic JWT validation
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const status = c.req.query('status') || 'approved';
    const reportIds = await kv.get(`reports:${status}`) || [];
    
    const reports = [];
    for (const id of reportIds) {
      const report = await kv.get(`report:${id}`);
      if (report) {
        reports.push(report);
      }
    }

    return c.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// Get My Reports
app.get('/make-server-c95fd11c/my-reports', async (c) => {
  try {
    // Use custom header to avoid Supabase's automatic JWT validation
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    console.log('Get my reports - Session token:', sessionToken ? 'Present' : 'Missing');
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      console.error('Get my reports - User verification failed');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Get my reports - User verified:', user.id, user.email);
    const reportIds = await kv.get(`user-reports:${user.id}`) || [];
    console.log('Get my reports - Report IDs for user:', reportIds.length, reportIds);
    
    const reports = [];
    const allActionsPrefix = `action:`;
    const allActions = await kv.getByPrefix(allActionsPrefix);
    
    for (const id of reportIds) {
      const report = await kv.get(`report:${id}`);
      if (report) {
        console.log('Get my reports - Found report:', id, report.itemName, report.status);
        
        // Find any pending action for this report to include action details
        let actionDetails = null;
        for (const action of allActions) {
          if (action.reportId === id && action.status === 'pending') {
            actionDetails = {
              id: action.id,
              actionType: action.actionType,
              actionByUserId: action.actionByUserId,
              actionByUserName: action.actionByUserName,
              actionByUserEmail: action.actionByUserEmail,
              createdAt: action.createdAt,
            };
            break;
          }
        }
        
        reports.push({
          ...report,
          actionDetails, // Include who found/claimed the item
        });
      } else {
        console.warn('Get my reports - Report ID exists but report not found:', id);
      }
    }

    console.log('Get my reports - Total reports returned:', reports.length);
    return c.json({ reports });
  } catch (error) {
    console.error('Get my reports error:', error);
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// Report Action (Found/Claim)
app.post('/make-server-c95fd11c/report-action', async (c) => {
  try {
    // Use custom header to avoid Supabase's automatic JWT validation
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { reportId, action } = await c.req.json();
    const report = await kv.get(`report:${reportId}`);

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // Check if user has already submitted an action for this report
    const existingActionKey = `user-action:${user.id}:${reportId}`;
    const existingAction = await kv.get(existingActionKey);
    
    if (existingAction) {
      return c.json({ error: 'You have already submitted a request for this report' }, 400);
    }

    // Create action record
    const actionId = crypto.randomUUID();
    const actionRecord = {
      id: actionId,
      reportId,
      actionType: action,
      actionByUserId: user.id,
      actionByUserName: user.name,
      actionByUserEmail: user.email,
      status: 'pending',
      createdAt: new Date().toISOString(),
      report,
    };

    await kv.set(`action:${actionId}`, actionRecord);
    
    // Track that this user has submitted an action for this report
    await kv.set(existingActionKey, actionId);

    // Add to actions list
    const actions = await kv.get('actions:all') || [];
    actions.unshift(actionId);
    await kv.set('actions:all', actions);

    // Notify report creator
    const message = action === 'found'
      ? `Someone has found your lost item: ${report.itemName}. Contact: ${user.name} (${user.email})`
      : `Someone has claimed your found item: ${report.itemName}. Contact: ${user.name} (${user.email})`;

    await createNotification(report.createdBy, action, message, reportId, user.id, actionId);

    return c.json({ success: true });
  } catch (error) {
    console.error('Report action error:', error);
    return c.json({ error: 'Failed to process action' }, 500);
  }
});

// Check if user has submitted an action for a report
app.get('/make-server-c95fd11c/report-action-status/:reportId', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reportId = c.req.param('reportId');
    
    // Check if the current user has submitted an action
    const existingActionKey = `user-action:${user.id}:${reportId}`;
    const existingAction = await kv.get(existingActionKey);

    // Additionally, check if ANY user has submitted an action for this report
    // This is useful for lost report owners to know if someone found their item
    let hasAnyAction = false;
    let actionDetails = null;
    const allActionsPrefix = `action:`;
    const allActions = await kv.getByPrefix(allActionsPrefix);
    
    for (const action of allActions) {
      if (action.reportId === reportId && action.status === 'pending') {
        hasAnyAction = true;
        // Store action details to show who found/claimed the item
        actionDetails = {
          id: action.id,
          actionType: action.actionType,
          actionByUserId: action.actionByUserId,
          actionByUserName: action.actionByUserName,
          actionByUserEmail: action.actionByUserEmail,
          createdAt: action.createdAt,
        };
        break;
      }
    }
    
    return c.json({ 
      hasSubmittedAction: !!existingAction, 
      actionId: existingAction,
      hasAnyAction, // Someone (anyone) has submitted an action
      actionDetails // Details about who found/claimed the item
    });
  } catch (error) {
    console.error('Check action status error:', error);
    return c.json({ error: 'Failed to check action status' }, 500);
  }
});

// Mark item as received (for found reports when claimer receives the item)
app.post('/make-server-c95fd11c/report/:reportId/mark-received', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      console.error('Mark received - User verification failed');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Mark received - User verified:', user.id, user.name);
    const reportId = c.req.param('reportId');
    const report = await kv.get(`report:${reportId}`);

    if (!report) {
      console.error('Mark received - Report not found:', reportId);
      return c.json({ error: 'Report not found' }, 404);
    }

    console.log('Mark received - Report found:', report.itemName, 'Type:', report.type);

    // Handle FOUND reports (existing logic)
    if (report.type === 'found') {
      // Verify the user claimed this item
      const existingActionKey = `user-action:${user.id}:${reportId}`;
      const actionId = await kv.get(existingActionKey);

      console.log('Mark received - Action ID from KV:', actionId);

      if (!actionId) {
        console.error('Mark received - No action found for user');
        return c.json({ error: 'You must claim this item before marking it as received' }, 403);
      }

      const action = await kv.get(`action:${actionId}`);
      console.log('Mark received - Action found:', action ? `Type: ${action.actionType}` : 'null');

      if (!action || action.actionType !== 'claim') {
        console.error('Mark received - Invalid action type:', action?.actionType);
        return c.json({ error: 'No claim action found' }, 404);
      }

      console.log('Mark received - Updating found report to delivered status');
      // Update the found report status to "delivered"
      report.deliveryStatus = 'delivered';
      report.deliveredAt = new Date().toISOString();
      await kv.set(`report:${reportId}`, report);

      // Find the claimer's lost report (if exists) and mark as "received"
      const claimerReports = await kv.get(`user-reports:${user.id}`) || [];
      let lostReportId = null;
      
      console.log('Mark received - Checking claimer reports:', claimerReports.length);
      for (const rId of claimerReports) {
        const r = await kv.get(`report:${rId}`);
        if (r && r.type === 'lost' && r.status === 'approved') {
          // This is a potential match - update it to received
          console.log('Mark received - Updating lost report:', rId);
          r.deliveryStatus = 'received';
          r.receivedAt = new Date().toISOString();
          await kv.set(`report:${rId}`, r);
          lostReportId = rId;
          break; // Assume one lost report per user for simplicity
        }
      }

      // Notify the founder that item was received
      console.log('Mark received - Notifying founder:', report.createdBy);
      await createNotification(
        report.createdBy,
        'completed',
        `${user.name} has confirmed receiving the item: ${report.itemName}. Thank you for your help!`,
        reportId,
        user.id,
        actionId
      );

      console.log('Mark received - SUCCESS (FOUND REPORT)!');
      return c.json({ 
        success: true, 
        message: 'Item marked as received successfully',
        lostReportUpdated: !!lostReportId
      });
    }

    // Handle LOST reports (NEW LOGIC)
    if (report.type === 'lost') {
      // Verify the user is the report creator
      if (report.createdBy !== user.id) {
        console.error('Mark received - User is not the lost report creator');
        return c.json({ error: 'Only the report creator can mark the item as received' }, 403);
      }

      // Check if someone has submitted a "found" action for this report
      const allActionsPrefix = `action:`;
      const allActions = await kv.getByPrefix(allActionsPrefix);
      
      let foundAction = null;
      for (const action of allActions) {
        if (action.reportId === reportId && action.actionType === 'found' && action.status === 'pending') {
          foundAction = action;
          break;
        }
      }

      if (!foundAction) {
        console.error('Mark received - No found action exists for this lost report');
        return c.json({ error: 'No one has submitted a found request for this item yet' }, 400);
      }

      console.log('Mark received - Updating lost report to delivered status');
      // Update the lost report status to "delivered"
      report.deliveryStatus = 'delivered';
      report.deliveredAt = new Date().toISOString();
      await kv.set(`report:${reportId}`, report);

      // Notify the founder that item was received
      console.log('Mark received - Notifying founder:', foundAction.actionByUserId);
      await createNotification(
        foundAction.actionByUserId,
        'completed',
        `${user.name} has confirmed receiving the item: ${report.itemName}. Thank you for your help!`,
        reportId,
        user.id,
        foundAction.id
      );

      console.log('Mark received - SUCCESS (LOST REPORT)!');
      return c.json({ 
        success: true, 
        message: 'Item marked as received successfully',
        reportType: 'lost'
      });
    }

    return c.json({ error: 'Invalid report type' }, 400);
  } catch (error) {
    console.error('Mark received error:', error);
    return c.json({ error: 'Failed to mark item as received' }, 500);
  }
});

// ===== NOTIFICATION ROUTES =====

// Get Notifications
app.get('/make-server-c95fd11c/notifications', async (c) => {
  try {
    // Use custom header to avoid Supabase's automatic JWT validation
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    console.log('Get notifications - Session token:', sessionToken ? 'Present' : 'Missing');
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      console.error('Get notifications - User verification failed');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Get notifications - User verified:', user.id);
    const notificationIds = await kv.get(`user-notifications:${user.id}`) || [];
    console.log('Get notifications - Notification IDs:', notificationIds);
    
    const notifications = [];
    for (const id of notificationIds) {
      const notification = await kv.get(`notification:${id}`);
      if (notification) {
        notifications.push(notification);
      }
    }

    console.log('Get notifications - Total notifications found:', notifications.length);
    return c.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// Mark Notification as Read
app.post('/make-server-c95fd11c/notifications/:id/read', async (c) => {
  try {
    // Use custom header to avoid Supabase's automatic JWT validation
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    const notification = await kv.get(`notification:${notificationId}`);

    if (!notification || notification.userId !== user.id) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    notification.read = true;
    await kv.set(`notification:${notificationId}`, notification);

    return c.json({ success: true });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return c.json({ error: 'Failed to update notification' }, 500);
  }
});

// Mark All Notifications as Read
app.post('/make-server-c95fd11c/notifications/mark-all-read', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    console.log('Mark all notifications as read - Token:', sessionToken ? 'Present' : 'Missing');
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      console.error('Mark all notifications as read - Unauthorized');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Mark all notifications as read - User:', user.id);
    const notificationIds = await kv.get(`user-notifications:${user.id}`) || [];
    console.log('Mark all notifications as read - Notification count:', notificationIds.length);
    
    if (notificationIds.length === 0) {
      console.log('Mark all notifications as read - No notifications to mark');
      return c.json({ success: true });
    }

    let updatedCount = 0;
    for (const id of notificationIds) {
      try {
        const notification = await kv.get(`notification:${id}`);
        if (notification && notification.userId === user.id) {
          notification.read = true;
          await kv.set(`notification:${id}`, notification);
          updatedCount++;
          console.log(`Marked notification ${id} as read`);
        }
      } catch (err) {
        console.error(`Error marking notification ${id} as read:`, err);
      }
    }

    console.log(`Mark all notifications as read - Success! Updated ${updatedCount} notifications`);
    return c.json({ success: true, updated: updatedCount });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return c.json({ error: 'Failed to mark all notifications as read' }, 500);
  }
});

// Delete All Notifications
app.post('/make-server-c95fd11c/notifications/delete-all', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    console.log('Delete all notifications - Token:', sessionToken ? 'Present' : 'Missing');
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      console.error('Delete all notifications - Unauthorized');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Delete all notifications - User:', user.id);
    const notificationIds = await kv.get(`user-notifications:${user.id}`) || [];
    console.log('Delete all notifications - Notification count:', notificationIds.length);
    
    if (notificationIds.length === 0) {
      console.log('Delete all notifications - No notifications to delete');
      await kv.set(`user-notifications:${user.id}`, []);
      return c.json({ success: true, deleted: 0 });
    }

    // Use batch delete for efficiency
    const keysToDelete = notificationIds.map((id: string) => `notification:${id}`);
    console.log('Delete all notifications - Keys to delete:', keysToDelete);
    
    try {
      await kv.mdel(keysToDelete);
      console.log('Delete all notifications - Batch delete successful');
    } catch (err) {
      console.error('Delete all notifications - Batch delete failed, trying individual deletes:', err);
      // Fallback to individual deletes
      for (const id of notificationIds) {
        try {
          await kv.del(`notification:${id}`);
        } catch (delErr) {
          console.error(`Error deleting notification ${id}:`, delErr);
        }
      }
    }
    
    // Clear user's notification list
    await kv.set(`user-notifications:${user.id}`, []);
    console.log('Delete all notifications - Cleared user notification list');

    console.log(`Delete all notifications - Success! Deleted ${notificationIds.length} notifications`);
    return c.json({ success: true, deleted: notificationIds.length });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    return c.json({ error: 'Failed to delete all notifications', details: error.message }, 500);
  }
});

// Get User Details (for viewing contact info from found/claim notifications)
app.get('/make-server-c95fd11c/user/:id', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('id');
    const targetUser = await kv.get(`user:${userId}`);

    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Return contact information
    return c.json({
      id: userId,
      name: targetUser.name,
      email: targetUser.email,
      userType: targetUser.userType,
      userId: targetUser.userId,
      phone: targetUser.phone,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return c.json({ error: 'Failed to fetch user details' }, 500);
  }
});

// TEST ENDPOINT - Create a test notification with contact details (for demo purposes)
app.post('/make-server-c95fd11c/test-notification', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Find another user to use as the action user
    const allUsers = await kv.getByPrefix('user:');
    const otherUser = allUsers.find((u: any) => u.id !== user.id);
    
    if (!otherUser) {
      return c.json({ error: 'No other users found for testing' }, 400);
    }

    // Create a test notification
    await createNotification(
      user.id,
      'found',
      `[TEST] Someone has found your lost item: Test Item. Contact: ${otherUser.name} (${otherUser.email})`,
      'test-report-id',
      otherUser.id
    );

    return c.json({ 
      success: true, 
      message: 'Test notification created successfully with contact details button!' 
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    return c.json({ error: 'Failed to create test notification' }, 500);
  }
});

// ===== CHAT ROUTES =====

// Get or create a chat between two users (user-to-user chat, not report-specific)
app.post('/make-server-c95fd11c/chat/create', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { reportId, actionId } = await c.req.json();

    // Get the action to verify it exists and get the other participant
    const action = await kv.get(`action:${actionId}`);
    if (!action) {
      return c.json({ error: 'Action not found' }, 404);
    }

    const report = await kv.get(`report:${reportId}`);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // Verify user is either the reporter or the actioner
    if (user.id !== report.createdBy && user.id !== action.actionByUserId) {
      return c.json({ error: 'Unauthorized to access this chat' }, 403);
    }

    // Determine the other user
    const otherUserId = user.id === report.createdBy ? action.actionByUserId : report.createdBy;
    
    // Create chat ID based on user pair (sorted to ensure consistency)
    const userIds = [user.id, otherUserId].sort();
    const chatId = `user_chat:${userIds[0]}:${userIds[1]}`;
    
    let chat = await kv.get(`chat:${chatId}`);

    if (!chat) {
      // Create new user-to-user chat
      const otherUser = await kv.get(`user:${otherUserId}`);

      chat = {
        id: chatId,
        user1Id: userIds[0],
        user2Id: userIds[1],
        user1Name: userIds[0] === user.id ? user.name : otherUser?.name || 'Unknown',
        user2Name: userIds[1] === user.id ? user.name : otherUser?.name || 'Unknown',
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      };

      await kv.set(`chat:${chatId}`, chat);

      // Add to both users' chat lists
      const user1Chats = await kv.get(`user_chats:${userIds[0]}`) || [];
      if (!user1Chats.includes(chatId)) {
        user1Chats.unshift(chatId);
        await kv.set(`user_chats:${userIds[0]}`, user1Chats);
      }

      const user2Chats = await kv.get(`user_chats:${userIds[1]}`) || [];
      if (!user2Chats.includes(chatId)) {
        user2Chats.unshift(chatId);
        await kv.set(`user_chats:${userIds[1]}`, user2Chats);
      }

      // Initialize empty messages array
      await kv.set(`chat_messages:${chatId}`, []);
    }

    return c.json({ chat });
  } catch (error) {
    console.error('Create chat error:', error);
    return c.json({ error: 'Failed to create chat' }, 500);
  }
});

// Get or create chat based on reportId (finds action automatically)
app.post('/make-server-c95fd11c/chat/create-by-report', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { reportId } = await c.req.json();

    const report = await kv.get(`report:${reportId}`);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // Find if current user has an action on this report
    const actionKey = `user-action:${user.id}:${reportId}`;
    const actionId = await kv.get(actionKey);

    if (!actionId) {
      return c.json({ 
        error: 'No action found',
        message: 'You need to submit a "Found" or "Claim" action before you can chat with the reporter.'
      }, 404);
    }

    // Get the action
    const action = await kv.get(`action:${actionId}`);
    if (!action) {
      return c.json({ error: 'Action not found' }, 404);
    }

    // Determine the other user
    const otherUserId = user.id === report.createdBy ? action.actionByUserId : report.createdBy;
    
    // Create chat ID based on user pair (sorted to ensure consistency)
    const userIds = [user.id, otherUserId].sort();
    const chatId = `user_chat:${userIds[0]}:${userIds[1]}`;
    
    let chat = await kv.get(`chat:${chatId}`);

    if (!chat) {
      // Create new user-to-user chat
      const otherUser = await kv.get(`user:${otherUserId}`);

      chat = {
        id: chatId,
        user1Id: userIds[0],
        user2Id: userIds[1],
        user1Name: userIds[0] === user.id ? user.name : otherUser?.name || 'Unknown',
        user2Name: userIds[1] === user.id ? user.name : otherUser?.name || 'Unknown',
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      };

      await kv.set(`chat:${chatId}`, chat);

      // Add to both users' chat lists
      const user1Chats = await kv.get(`user_chats:${userIds[0]}`) || [];
      if (!user1Chats.includes(chatId)) {
        user1Chats.unshift(chatId);
        await kv.set(`user_chats:${userIds[0]}`, user1Chats);
      }

      const user2Chats = await kv.get(`user_chats:${userIds[1]}`) || [];
      if (!user2Chats.includes(chatId)) {
        user2Chats.unshift(chatId);
        await kv.set(`user_chats:${userIds[1]}`, user2Chats);
      }

      // Initialize empty messages array
      await kv.set(`chat_messages:${chatId}`, []);
    }

    return c.json({ chat, actionId });
  } catch (error) {
    console.error('Create chat by report error:', error);
    return c.json({ error: 'Failed to create chat' }, 500);
  }
});

// Send a message in a chat
app.post('/make-server-c95fd11c/chat/:chatId/message', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    const { message, reportId, reportName } = await c.req.json();

    if (!message || message.trim() === '') {
      return c.json({ error: 'Message cannot be empty' }, 400);
    }

    // Get chat to verify access
    const chat = await kv.get(`chat:${chatId}`);
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    // Verify user is a participant
    if (user.id !== chat.user1Id && user.id !== chat.user2Id) {
      return c.json({ error: 'Unauthorized to send messages in this chat' }, 403);
    }

    // Create message
    const messageId = crypto.randomUUID();
    const newMessage = {
      id: messageId,
      chatId,
      senderId: user.id,
      senderName: user.name,
      message: message.trim(),
      reportId: reportId || null,
      reportName: reportName || null,
      createdAt: new Date().toISOString(),
    };

    // Get existing messages and add new one
    const messages = await kv.get(`chat_messages:${chatId}`) || [];
    messages.push(newMessage);
    await kv.set(`chat_messages:${chatId}`, messages);

    // Update chat's lastMessageAt
    chat.lastMessageAt = newMessage.createdAt;
    chat.lastMessage = message.trim().substring(0, 100); // Store preview
    chat.lastReportName = reportName || null;
    await kv.set(`chat:${chatId}`, chat);

    // Send notification to the other user
    const recipientId = user.id === chat.user1Id ? chat.user2Id : chat.user1Id;
    const contextText = reportName ? ` about ${reportName}` : '';
    await createNotification(
      recipientId,
      'found', // Reusing type for now
      `New message from ${user.name}${contextText}`,
      reportId || '',
      user.id
    );

    return c.json({ message: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get messages for a chat
app.get('/make-server-c95fd11c/chat/:chatId/messages', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');

    // Get chat to verify access
    const chat = await kv.get(`chat:${chatId}`);
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    // Verify user is a participant
    if (user.id !== chat.user1Id && user.id !== chat.user2Id) {
      return c.json({ error: 'Unauthorized to view this chat' }, 403);
    }

    // Get messages
    const messages = await kv.get(`chat_messages:${chatId}`) || [];

    return c.json({ chat, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return c.json({ error: 'Failed to get messages' }, 500);
  }
});

// Get all chats for a user
app.get('/make-server-c95fd11c/chats', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's chat list
    const chatIds = await kv.get(`user_chats:${user.id}`) || [];
    
    // Get full chat objects
    const chats = [];
    for (const chatId of chatIds) {
      const chat = await kv.get(`chat:${chatId}`);
      if (chat) {
        // Get message count
        const messages = await kv.get(`chat_messages:${chatId}`) || [];
        chat.messageCount = messages.length;
        chat.otherUserName = user.id === chat.user1Id ? chat.user2Name : chat.user1Name;
        chat.otherUserId = user.id === chat.user1Id ? chat.user2Id : chat.user1Id;
        chats.push(chat);
      }
    }

    // Sort by last message time
    chats.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return c.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    return c.json({ error: 'Failed to get chats' }, 500);
  }
});

// Mark All Chats as Read
app.post('/make-server-c95fd11c/chats/mark-all-read', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    console.log('Mark all chats as read - Token:', sessionToken ? 'Present' : 'Missing');
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      console.error('Mark all chats as read - Unauthorized');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Mark all chats as read - User:', user.id);
    // Get user's chat list
    const chatIds = await kv.get(`user_chats:${user.id}`) || [];
    console.log('Mark all chats as read - Chat count:', chatIds.length);
    
    // Mark all messages in each chat as read (we'll implement this as a simple success response since there's no read status on messages)
    // In a real implementation, you'd track message read status per user
    
    console.log('Mark all chats as read - Success!');
    return c.json({ success: true });
  } catch (error) {
    console.error('Mark all chats as read error:', error);
    return c.json({ error: 'Failed to mark all chats as read', details: error.message }, 500);
  }
});

// Delete All Chats
app.post('/make-server-c95fd11c/chats/delete-all', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token') || c.req.header('Authorization')?.split(' ')[1];
    console.log('Delete all chats - Token:', sessionToken ? 'Present' : 'Missing');
    const user = await verifyUserToken(sessionToken || '');
    
    if (!user) {
      console.error('Delete all chats - Unauthorized');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Delete all chats - User:', user.id);
    // Get user's chat list
    const chatIds = await kv.get(`user_chats:${user.id}`) || [];
    console.log('Delete all chats - Chat count:', chatIds.length);
    
    if (chatIds.length === 0) {
      console.log('Delete all chats - No chats to delete');
      await kv.set(`user_chats:${user.id}`, []);
      return c.json({ success: true, deleted: 0 });
    }
    
    let deletedCount = 0;
    // Delete all chats and their messages
    for (const chatId of chatIds) {
      try {
        const chat = await kv.get(`chat:${chatId}`);
        
        if (chat) {
          console.log(`Delete all chats - Deleting chat: ${chatId}`);
          
          // Delete messages
          try {
            await kv.del(`chat_messages:${chatId}`);
            console.log(`Delete all chats - Deleted messages for chat: ${chatId}`);
          } catch (msgErr) {
            console.error(`Delete all chats - Error deleting messages for chat ${chatId}:`, msgErr);
          }
          
          // Remove chat from the other user's list
          try {
            const otherUserId = user.id === chat.user1Id ? chat.user2Id : chat.user1Id;
            const otherUserChats = await kv.get(`user_chats:${otherUserId}`) || [];
            const updatedOtherUserChats = otherUserChats.filter((id: string) => id !== chatId);
            await kv.set(`user_chats:${otherUserId}`, updatedOtherUserChats);
            console.log(`Delete all chats - Updated other user's chat list: ${otherUserId}`);
          } catch (otherErr) {
            console.error(`Delete all chats - Error updating other user's chat list:`, otherErr);
          }
          
          // Delete the chat itself
          try {
            await kv.del(`chat:${chatId}`);
            console.log(`Delete all chats - Deleted chat: ${chatId}`);
            deletedCount++;
          } catch (chatErr) {
            console.error(`Delete all chats - Error deleting chat ${chatId}:`, chatErr);
          }
        } else {
          console.log(`Delete all chats - Chat not found: ${chatId}`);
        }
      } catch (err) {
        console.error(`Delete all chats - Error processing chat ${chatId}:`, err);
      }
    }
    
    // Clear user's chat list
    await kv.set(`user_chats:${user.id}`, []);
    console.log('Delete all chats - Cleared user chat list');

    console.log(`Delete all chats - Success! Deleted ${deletedCount} chats`);
    return c.json({ success: true, deleted: deletedCount });
  } catch (error) {
    console.error('Delete all chats error:', error);
    return c.json({ error: 'Failed to delete all chats', details: error.message }, 500);
  }
});

// ===== ADMIN ROUTES =====

// Get Reports (Admin)
app.get('/make-server-c95fd11c/admin/reports', async (c) => {
  try {
    // Check both X-Admin-Token and Authorization header for admin token
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    console.log('Admin get reports - Token:', accessToken ? 'Present' : 'Missing');
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      console.error('Admin get reports - Admin verification failed');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Admin get reports - Admin verified');
    const status = c.req.query('status') || 'pending';
    console.log('Admin get reports - Status filter:', status);
    
    const reportIds = await kv.get(`reports:${status}`) || [];
    console.log('Admin get reports - Report IDs from KV:', reportIds);
    
    const reports = [];
    for (const id of reportIds) {
      const report = await kv.get(`report:${id}`);
      if (report) {
        reports.push(report);
        console.log('Admin get reports - Found report:', id, report.itemName);
      } else {
        console.log('Admin get reports - Report not found for ID:', id);
      }
    }

    console.log('Admin get reports - Total reports found:', reports.length);
    return c.json({ reports });
  } catch (error) {
    console.error('Admin get reports error:', error);
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// Approve Report
app.post('/make-server-c95fd11c/admin/report/:id/approve', async (c) => {
  try {
    // Check both X-Admin-Token and Authorization header for admin token
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reportId = c.req.param('id');
    const report = await kv.get(`report:${reportId}`);

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // Update report status
    report.status = 'approved';
    await kv.set(`report:${reportId}`, report);

    // Move from pending to approved list
    const pendingReports = await kv.get('reports:pending') || [];
    const updatedPending = pendingReports.filter((id: string) => id !== reportId);
    await kv.set('reports:pending', updatedPending);

    const approvedReports = await kv.get('reports:approved') || [];
    approvedReports.unshift(reportId);
    await kv.set('reports:approved', approvedReports);

    // Notify user
    await createNotification(
      report.createdBy,
      'approval',
      `Your report "${report.itemName}" has been approved and is now published!`,
      reportId
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Approve report error:', error);
    return c.json({ error: 'Failed to approve report' }, 500);
  }
});

// Reject Report
app.post('/make-server-c95fd11c/admin/report/:id/reject', async (c) => {
  try {
    // Check both X-Admin-Token and Authorization header for admin token
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reportId = c.req.param('id');
    const report = await kv.get(`report:${reportId}`);

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // Update report status
    report.status = 'rejected';
    await kv.set(`report:${reportId}`, report);

    // Move from pending to rejected list
    const pendingReports = await kv.get('reports:pending') || [];
    const updatedPending = pendingReports.filter((id: string) => id !== reportId);
    await kv.set('reports:pending', updatedPending);

    const rejectedReports = await kv.get('reports:rejected') || [];
    rejectedReports.unshift(reportId);
    await kv.set('reports:rejected', rejectedReports);

    // Notify user
    await createNotification(
      report.createdBy,
      'rejection',
      `Your report "${report.itemName}" has been rejected. Please contact admin for more information.`,
      reportId
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Reject report error:', error);
    return c.json({ error: 'Failed to reject report' }, 500);
  }
});

// Get Found/Claimed Actions
app.get('/make-server-c95fd11c/admin/found-claimed', async (c) => {
  try {
    // Check both X-Admin-Token and Authorization header for admin token
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const actionIds = await kv.get('actions:all') || [];
    
    const actions = [];
    for (const id of actionIds) {
      const action = await kv.get(`action:${id}`);
      // Only include actions with pending status
      if (action && action.status === 'pending') {
        // Fetch the associated report to include deliveryStatus
        const report = await kv.get(`report:${action.reportId}`);
        
        if (report) {
          // Include full report details with deliveryStatus
          actions.push({
            ...action,
            report: {
              id: report.id,
              type: report.type,
              itemName: report.itemName,
              category: report.category,
              description: report.description,
              date: report.date,
              location: report.location,
              photoUrl: report.photoUrl,
              createdBy: report.createdBy,
              creatorName: report.creatorName,
              creatorEmail: report.creatorEmail,
              deliveryStatus: report.deliveryStatus || 'pending', // Include delivery status
            }
          });
        } else {
          // If report not found, still include action but without report details
          actions.push(action);
        }
      }
    }

    console.log('Found/Claimed actions fetched:', actions.length, 'actions with delivery status included');
    
    // Log details about each action for debugging
    actions.forEach(action => {
      console.log(`Action ${action.id}: reportType=${action.report?.type}, actionType=${action.actionType}, deliveryStatus=${action.report?.deliveryStatus}`);
    });
    
    return c.json({ actions });
  } catch (error) {
    console.error('Get found/claimed error:', error);
    return c.json({ error: 'Failed to fetch actions' }, 500);
  }
});

// Complete Action
app.post('/make-server-c95fd11c/admin/complete-action', async (c) => {
  try {
    // Check both X-Admin-Token and Authorization header for admin token
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { actionId, reportId } = await c.req.json();
    
    const action = await kv.get(`action:${actionId}`);
    const report = await kv.get(`report:${reportId}`);

    if (!action || !report) {
      return c.json({ error: 'Action or report not found' }, 404);
    }

    // Update action status
    action.status = 'completed';
    await kv.set(`action:${actionId}`, action);

    // Update report status
    report.status = 'completed';
    await kv.set(`report:${reportId}`, report);

    // Move report to completed list
    const approvedReports = await kv.get('reports:approved') || [];
    const updatedApproved = approvedReports.filter((id: string) => id !== reportId);
    await kv.set('reports:approved', updatedApproved);

    const completedReports = await kv.get('reports:completed') || [];
    completedReports.unshift(reportId);
    await kv.set('reports:completed', completedReports);

    // Notify report creator
    await createNotification(
      report.createdBy,
      'completed',
      `Your report "${report.itemName}" has been marked as completed. The item has been returned!`,
      reportId
    );

    // Notify action user
    await createNotification(
      action.actionByUserId,
      'completed',
      `The report "${report.itemName}" you interacted with has been completed. Thank you!`,
      reportId
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Complete action error:', error);
    return c.json({ error: 'Failed to complete action' }, 500);
  }
});

// Get Users
app.get('/make-server-c95fd11c/admin/users', async (c) => {
  try {
    // Get admin token from custom header
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      console.log('Admin verification failed');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Fetching users from database...');
    // Use the already initialized supabase client with service role key
    const { data, error } = await supabase
      .from('kv_store_c95fd11c')
      .select('key, value')
      .like('key', 'user:%');
    
    if (error) {
      console.error('Database query error:', error);
      return c.json({ error: 'Failed to fetch users' }, 500);
    }
    
    console.log('Raw user data from DB:', data);
    
    const users = (data || []).map(item => ({
      id: item.key.replace('user:', ''),
      ...item.value
    }));
    
    console.log('Processed users:', users);

    return c.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get User Details by ID
app.get('/make-server-c95fd11c/admin/user/:id', async (c) => {
  try {
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('id');
    const user = await kv.get(`user:${userId}`);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: userId,
      name: user.name,
      email: user.email,
      userType: user.userType,
      userId: user.userId,
      phone: user.phone,
      banned: user.banned || false,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return c.json({ error: 'Failed to fetch user details' }, 500);
  }
});

// Ban User
app.post('/make-server-c95fd11c/admin/user/:id/ban', async (c) => {
  try {
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('id');
    const user = await kv.get(`user:${userId}`);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    user.banned = true;
    await kv.set(`user:${userId}`, user);

    return c.json({ success: true });
  } catch (error) {
    console.error('Ban user error:', error);
    return c.json({ error: 'Failed to ban user' }, 500);
  }
});

// Unban User
app.post('/make-server-c95fd11c/admin/user/:id/unban', async (c) => {
  try {
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('id');
    const user = await kv.get(`user:${userId}`);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    user.banned = false;
    await kv.set(`user:${userId}`, user);

    return c.json({ success: true });
  } catch (error) {
    console.error('Unban user error:', error);
    return c.json({ error: 'Failed to unban user' }, 500);
  }
});

// Delete User (Admin)
app.delete('/make-server-c95fd11c/admin/user/:id/delete', async (c) => {
  try {
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    console.log('Delete user - Token:', accessToken ? 'Present' : 'Missing');
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      console.error('Delete user - Unauthorized');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('id');
    console.log('Delete user - User ID:', userId);
    const user = await kv.get(`user:${userId}`);

    if (!user) {
      console.error('Delete user - User not found:', userId);
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('Deleting user:', userId, user.email);

    // Delete user from Supabase Auth
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Error deleting user from auth:', authError);
        // Continue with deletion even if auth deletion fails
      }
    } catch (authError) {
      console.error('Exception deleting user from auth:', authError);
    }

    // Delete user's reports
    console.log('Delete user - Deleting reports');
    const userReports = await kv.get(`user-reports:${userId}`) || [];
    console.log('Delete user - Report count:', userReports.length);
    for (const reportId of userReports) {
      try {
        const report = await kv.get(`report:${reportId}`);
        if (report) {
          // Remove from status lists
          const statusKey = `reports:${report.status}`;
          const statusReports = await kv.get(statusKey) || [];
          const updatedStatusReports = statusReports.filter((id: string) => id !== reportId);
          await kv.set(statusKey, updatedStatusReports);
          
          // Delete the report
          await kv.del(`report:${reportId}`);
          console.log('Delete user - Deleted report:', reportId);
        }
      } catch (err) {
        console.error(`Delete user - Error deleting report ${reportId}:`, err);
      }
    }
    await kv.del(`user-reports:${userId}`);

    // Delete user's notifications
    console.log('Delete user - Deleting notifications');
    const userNotifications = await kv.get(`user-notifications:${userId}`) || [];
    console.log('Delete user - Notification count:', userNotifications.length);
    const notificationKeys = userNotifications.map((id: string) => `notification:${id}`);
    if (notificationKeys.length > 0) {
      try {
        await kv.mdel(notificationKeys);
        console.log('Delete user - Deleted notifications');
      } catch (err) {
        console.error('Delete user - Error deleting notifications:', err);
        // Fallback to individual deletes
        for (const notificationId of userNotifications) {
          try {
            await kv.del(`notification:${notificationId}`);
          } catch (delErr) {
            console.error(`Delete user - Error deleting notification ${notificationId}:`, delErr);
          }
        }
      }
    }
    await kv.del(`user-notifications:${userId}`);

    // Delete user's chats
    console.log('Delete user - Deleting chats');
    const userChats = await kv.get(`user_chats:${userId}`) || [];
    console.log('Delete user - Chat count:', userChats.length);
    for (const chatId of userChats) {
      try {
        const chat = await kv.get(`chat:${chatId}`);
        if (chat) {
          // Delete messages
          await kv.del(`chat_messages:${chatId}`);
          
          // Remove chat from other user's list
          const otherUserId = userId === chat.user1Id ? chat.user2Id : chat.user1Id;
          const otherUserChats = await kv.get(`user_chats:${otherUserId}`) || [];
          const updatedOtherUserChats = otherUserChats.filter((id: string) => id !== chatId);
          await kv.set(`user_chats:${otherUserId}`, updatedOtherUserChats);
          
          // Delete the chat
          await kv.del(`chat:${chatId}`);
          console.log('Delete user - Deleted chat:', chatId);
        }
      } catch (err) {
        console.error(`Delete user - Error deleting chat ${chatId}:`, err);
      }
    }
    await kv.del(`user_chats:${userId}`);

    // Delete user's actions
    console.log('Delete user - Deleting actions');
    const allActions = await kv.getByPrefix('action:');
    let deletedActions = 0;
    for (const action of allActions) {
      try {
        if (action.actionByUserId === userId) {
          await kv.del(`action:${action.id}`);
          
          // Remove from actions list
          const actionsList = await kv.get('actions:all') || [];
          const updatedActionsList = actionsList.filter((id: string) => id !== action.id);
          await kv.set('actions:all', updatedActionsList);
          
          // Remove user-action key
          await kv.del(`user-action:${userId}:${action.reportId}`);
          deletedActions++;
        }
      } catch (err) {
        console.error(`Delete user - Error deleting action ${action.id}:`, err);
      }
    }
    console.log('Delete user - Deleted actions:', deletedActions);

    // Delete user's sessions
    console.log('Delete user - Deleting sessions');
    const allSessions = await kv.getByPrefix('session:');
    let deletedSessions = 0;
    for (const session of allSessions) {
      try {
        if (session.userId === userId) {
          const sessionKeys = await kv.getByPrefix('session:');
          for (const key of sessionKeys) {
            const keyStr = typeof key === 'string' ? key : JSON.stringify(key);
            if (keyStr.includes(userId)) {
              const sessionToken = keyStr.replace('session:', '');
              await kv.del(`session:${sessionToken}`);
              deletedSessions++;
            }
          }
        }
      } catch (err) {
        console.error('Delete user - Error deleting session:', err);
      }
    }
    console.log('Delete user - Deleted sessions:', deletedSessions);

    // Delete user data
    console.log('Delete user - Deleting user data');
    await kv.del(`user:${userId}`);
    await kv.del(`user-email:${user.email}`);

    console.log('User deleted successfully:', userId);
    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user', details: error.message }, 500);
  }
});

// Initialize storage bucket on startup
async function initializeStorage() {
  try {
    console.log('Initializing storage bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketName = 'make-c95fd11c-reports';
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} does not exist, creating...`);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log(`Created storage bucket: ${bucketName}`);
      }
    } else {
      console.log(`Storage bucket ${bucketName} already exists`);
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
  }
}

// Sync user metadata to Supabase Auth (Admin only - for fixing existing users)
app.post('/make-server-c95fd11c/admin/sync-user-metadata', async (c) => {
  try {
    const accessToken = c.req.header('X-Admin-Token') || c.req.header('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(accessToken || '');
    
    if (!admin) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('Starting user metadata sync...');
    
    // Get all users from Supabase directly using SQL query
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    const { data: kvUsers, error: kvError } = await supabaseClient
      .from('kv_store_c95fd11c')
      .select('key, value')
      .like('key', 'user:%')
      .not('key', 'like', '%email%');

    if (kvError) {
      console.error('Error fetching users from KV store:', kvError);
      return c.json({ error: 'Failed to fetch users from database' }, 500);
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const row of kvUsers || []) {
      // Extract user ID from key (format: "user:uuid")
      const userId = row.key.split(':')[1];
      const userData = row.value;
      
      if (!userId || !userData || !userData.email) {
        continue;
      }

      try {
        console.log(`Syncing user: ${userId} - ${userData.name}`);
        
        // Update Supabase Auth user metadata
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            name: userData.name,
            userType: userData.userType,
            userId: userData.userId,
            phone: userData.phone,
            display_name: userData.name,
            full_name: userData.name,
            university_id: userData.userId,
            user_type: userData.userType,
          },
          phone: userData.phone,
        });

        if (error) {
          console.error(`Failed to sync user ${userId}:`, error);
          failedCount++;
        } else {
          console.log(`Successfully synced user ${userId} - ${userData.name}`);
          syncedCount++;
        }
      } catch (err) {
        console.error(`Error syncing user ${userId}:`, err);
        failedCount++;
      }
    }

    console.log(`User metadata sync complete. Synced: ${syncedCount}, Failed: ${failedCount}`);
    return c.json({ 
      success: true, 
      synced: syncedCount, 
      failed: failedCount,
      message: `Successfully synced ${syncedCount} users. ${failedCount} failed.`
    });
  } catch (error) {
    console.error('Sync user metadata error:', error);
    return c.json({ error: 'Failed to sync user metadata', details: error.message }, 500);
  }
});

// Initialize on startup
initializeStorage();

Deno.serve(app.fetch);