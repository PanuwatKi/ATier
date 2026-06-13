// Data layer for the Mock Exam feature.
// Taking/grading goes through SECURITY DEFINER RPCs (server hides the
// correct answers until submit). Admin CRUD hits the tables directly
// (RLS allows only real admins to write).
import { supabase } from '../supabaseClient';

/* ----------------------- Catalogue & taking (RPCs) ----------------------- */

export async function listExams() {
  const { data, error } = await supabase.rpc('mock_list_exams');
  if (error) throw error;
  return data || [];
}

export async function startAttempt(examId) {
  const { data, error } = await supabase.rpc('mock_start_attempt', { p_exam_id: examId });
  if (error) throw error;
  return data;
}

export async function getAttempt(attemptId) {
  const { data, error } = await supabase.rpc('mock_get_attempt', { p_attempt_id: attemptId });
  if (error) throw error;
  return data;
}

export async function saveProgress(attemptId, answers) {
  const { error } = await supabase.rpc('mock_save_progress', {
    p_attempt_id: attemptId,
    p_answers: answers,
  });
  if (error) throw error;
}

export async function submitAttempt(attemptId, answers, auto = false) {
  const { data, error } = await supabase.rpc('mock_submit_attempt', {
    p_attempt_id: attemptId,
    p_answers: answers,
    p_auto: auto,
  });
  if (error) throw error;
  return data;
}

export async function getResults(attemptId) {
  const { data, error } = await supabase.rpc('mock_get_results', { p_attempt_id: attemptId });
  if (error) throw error;
  return data;
}

export async function myAttempts(examId) {
  const { data, error } = await supabase.rpc('mock_my_attempts', { p_exam_id: examId });
  if (error) throw error;
  return data || [];
}

/* --------------------------- Admin CRUD (tables) -------------------------- */

export async function createExam(payload) {
  const { data, error } = await supabase.from('exams').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateExam(id, patch) {
  const { error } = await supabase
    .from('exams')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteExam(id) {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
}

// Full exam with questions + options (admin only — includes is_correct/explanation)
export async function getExamFull(id) {
  const { data: exam, error: e1 } = await supabase.from('exams').select('*').eq('id', id).single();
  if (e1) throw e1;
  const { data: questions, error: e2 } = await supabase
    .from('exam_questions')
    .select('*, exam_options(*)')
    .eq('exam_id', id)
    .order('order_index', { ascending: true });
  if (e2) throw e2;
  (questions || []).forEach((q) =>
    q.exam_options?.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  );
  return { exam, questions: questions || [] };
}

// Insert or update a question + replace its options in one go.
export async function saveQuestion(examId, q) {
  let questionId = q.id;
  const qRow = {
    exam_id: examId,
    question_text: q.question_text,
    image_url: q.image_url || null,
    explanation: q.explanation || null,
    explanation_visible: q.explanation_visible,
    allow_multiple: q.allow_multiple,
    order_index: q.order_index ?? 0,
  };

  if (questionId) {
    const { error } = await supabase.from('exam_questions').update(qRow).eq('id', questionId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from('exam_questions').insert([qRow]).select().single();
    if (error) throw error;
    questionId = data.id;
  }

  // Replace options wholesale (simplest correct approach for an editor).
  await supabase.from('exam_options').delete().eq('question_id', questionId);
  const optionRows = (q.options || []).map((o, i) => ({
    question_id: questionId,
    order_index: i,
    option_text: o.option_text || '',
    image_url: o.image_url || null,
    is_correct: !!o.is_correct,
  }));
  if (optionRows.length) {
    const { error } = await supabase.from('exam_options').insert(optionRows);
    if (error) throw error;
  }
  return questionId;
}

export async function deleteQuestion(id) {
  const { error } = await supabase.from('exam_questions').delete().eq('id', id);
  if (error) throw error;
}

// Upload a question/option image to the public exam-assets bucket.
export async function uploadExamImage(file) {
  const ext = file.name.split('.').pop();
  const path = `questions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('exam-assets').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('exam-assets').getPublicUrl(path);
  return data.publicUrl;
}
