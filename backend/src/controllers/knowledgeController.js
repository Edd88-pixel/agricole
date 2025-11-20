import { supabaseService } from '../services/supabaseService.js';

export const listKnowledgeArticles = async (_req, res, next) => {
  try {
    const data = await supabaseService.fetchKnowledgeArticles();
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
