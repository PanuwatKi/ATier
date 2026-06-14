// Data layer for payments, enrollments and payment settings.
import { supabase } from '../supabaseClient';

export async function getSettings() {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

export async function updateSettings(patch) {
  const { error } = await supabase
    .from('app_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw error;
}

// Returns one of: {already_enrolled}, {granted_free}, or {payment_id, amount, item_title}
export async function createPayment(itemType, itemId) {
  const { data, error } = await supabase.rpc('create_payment', {
    p_item_type: itemType,
    p_item_id: String(itemId),
  });
  if (error) throw error;
  return data;
}

export async function uploadSlip(file) {
  const ext = file.name.split('.').pop();
  const path = `slips/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('payment-slips').upload(path, file);
  if (error) throw error;
  return path;
}

export async function submitSlip(paymentId, slipPath) {
  const { error } = await supabase.rpc('submit_payment_slip', {
    p_payment_id: paymentId,
    p_slip_path: slipPath,
  });
  if (error) throw error;
}

export async function myEnrollments() {
  const { data, error } = await supabase.rpc('my_enrollments');
  if (error) throw error;
  return data || [];
}

export async function myPayments() {
  const { data, error } = await supabase.rpc('my_payments');
  if (error) throw error;
  return data || [];
}

export async function adminListPayments(status = null) {
  const { data, error } = await supabase.rpc('admin_list_payments', { p_status: status });
  if (error) throw error;
  return data || [];
}

export async function adminReviewPayment(paymentId, approve, note = null) {
  const { error } = await supabase.rpc('admin_review_payment', {
    p_payment_id: paymentId,
    p_approve: approve,
    p_note: note,
  });
  if (error) throw error;
}

// Private bucket → admins view slips through a short-lived signed URL.
export async function signedSlipUrl(path) {
  const { data, error } = await supabase.storage.from('payment-slips').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// Gated course content (lectures/videos) — only for enrolled users / admins.
export async function getCourseLectures(courseId) {
  const { data, error } = await supabase.rpc('get_course_lectures', { p_course_id: String(courseId) });
  if (error) throw error;
  return data || [];
}

// Convenience: build a Set of "type:id" the current user already owns.
export async function ownedSet() {
  const list = await myEnrollments();
  return new Set(list.map((e) => `${e.item_type}:${e.item_id}`));
}

export async function myEnrollmentsDetailed() {
  const { data, error } = await supabase.rpc('my_enrollments_detailed');
  if (error) throw error;
  return data || [];
}

export async function cancelPayment(paymentId) {
  const { error } = await supabase.rpc('cancel_payment', { p_payment_id: paymentId });
  if (error) throw error;
}

export async function reportPaymentIssue(paymentId, message) {
  const { error } = await supabase.rpc('report_payment_issue', {
    p_payment_id: paymentId,
    p_message: message,
  });
  if (error) throw error;
}
