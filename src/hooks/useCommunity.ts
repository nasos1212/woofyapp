import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

export interface Question {
  id: string;
  user_id: string;
  pet_id: string | null;
  category_id: string;
  title: string;
  content: string;
  urgency: 'general' | 'concerned' | 'urgent';
  breed_tags: string[];
  status: 'open' | 'answered' | 'resolved' | 'closed';
  is_pinned: boolean;
  is_featured: boolean;
  is_anonymous: boolean;
  view_count: number;
  helped_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  pet?: {
    pet_name: string;
    pet_breed: string | null;
  };
  photos?: QuestionPhoto[];
  answer_count?: number;
  is_saved?: boolean;
  is_following?: boolean;
}

export interface QuestionPhoto {
  id: string;
  question_id: string;
  photo_url: string;
  caption: string | null;
  display_order: number;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  is_accepted: boolean;
  is_verified_pro: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  expert_stats?: ExpertStats;
  photos?: AnswerPhoto[];
  user_vote?: 'up' | 'down' | null;
}

export interface AnswerPhoto {
  id: string;
  answer_id: string;
  photo_url: string;
  caption: string | null;
  display_order: number;
}

export interface ExpertStats {
  id: string;
  user_id: string;
  total_answers: number;
  accepted_answers: number;
  total_upvotes: number;
  reputation_score: number;
  expertise_areas: string[];
  is_verified_professional: boolean;
  professional_title: string | null;
  professional_credentials: string | null;
}

export const useCommunity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('community_categories')
      .select('*')
      .order('display_order');
    
    if (error) throw error;
    return data || [];
  }, []);

  const fetchQuestions = useCallback(async (filters?: {
    category_id?: string;
    urgency?: string;
    status?: string;
    search?: string;
    breed?: string;
    animal_type?: string;
    sort?: 'recent' | 'popular' | 'unanswered';
    limit?: number;
    offset?: number;
  }): Promise<Question[]> => {
    let query = supabase
      .from('community_questions')
      .select(`
        *,
        category:community_categories(*),
        photos:community_question_photos(*)
      `)
      .order('is_pinned', { ascending: false });

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters?.urgency) {
      query = query.eq('urgency', filters.urgency);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }
    if (filters?.breed) {
      query = query.contains('breed_tags', [filters.breed]);
    }
    if (filters?.animal_type) {
      query = query.eq('animal_type', filters.animal_type);
    }

    // Sorting
    if (filters?.sort === 'popular') {
      query = query.order('helped_count', { ascending: false });
    } else if (filters?.sort === 'unanswered') {
      query = query.eq('status', 'open');
    }
    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch author profiles separately
    const userIds = [...new Set(data.map(q => q.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]) || []);

    // Get saved and following status for current user
    if (user) {
      const questionIds = data.map(q => q.id);
      
      const [savedRes, followingRes] = await Promise.all([
        supabase
          .from('community_saved_questions')
          .select('question_id')
          .eq('user_id', user.id)
          .in('question_id', questionIds),
        supabase
          .from('community_question_followers')
          .select('question_id')
          .eq('user_id', user.id)
          .in('question_id', questionIds)
      ]);

      const savedIds = new Set(savedRes.data?.map(s => s.question_id) || []);
      const followingIds = new Set(followingRes.data?.map(f => f.question_id) || []);

      return data.map(q => ({
        ...q,
        author: profileMap.get(q.user_id) || null,
        answer_count: 0,
        is_saved: savedIds.has(q.id),
        is_following: followingIds.has(q.id)
      })) as unknown as Question[];
    }

    return data.map(q => ({
      ...q,
      author: profileMap.get(q.user_id) || null,
      answer_count: 0
    })) as unknown as Question[];
  }, [user]);

  const fetchQuestion = useCallback(async (id: string): Promise<Question | null> => {
    const { data, error } = await supabase
      .from('community_questions')
      .select(`
        *,
        category:community_categories(*),
        photos:community_question_photos(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch author profile separately
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', data.user_id)
      .maybeSingle();

    // Increment view count
    await supabase
      .from('community_questions')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id);

    // Get saved and following status
    if (user) {
      const [savedRes, followingRes, answersRes] = await Promise.all([
        supabase
          .from('community_saved_questions')
          .select('id')
          .eq('user_id', user.id)
          .eq('question_id', id)
          .maybeSingle(),
        supabase
          .from('community_question_followers')
          .select('id')
          .eq('user_id', user.id)
          .eq('question_id', id)
          .maybeSingle(),
        supabase
          .from('community_answers')
          .select('id', { count: 'exact' })
          .eq('question_id', id)
      ]);

      return {
        ...data,
        author: authorProfile || null,
        is_saved: !!savedRes.data,
        is_following: !!followingRes.data,
        answer_count: answersRes.count || 0
      } as unknown as Question;
    }

    return {
      ...data,
      author: authorProfile || null
    } as unknown as Question;
  }, [user]);

  const createQuestion = useCallback(async (question: {
    category_id: string;
    title: string;
    content: string;
    urgency: 'general' | 'concerned' | 'urgent';
    animal_type?: 'dog' | 'cat';
    breed_tags?: string[];
    pet_id?: string;
    is_anonymous?: boolean;
  }, photos?: File[]): Promise<Question> => {
    if (!user) throw new Error('Must be logged in');

    setLoading(true);
    try {
      // Create question
      const { data, error } = await supabase
        .from('community_questions')
        .insert({
          user_id: user.id,
          ...question
        })
        .select()
        .single();

      if (error) throw error;

      // Upload photos if any
      if (photos && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${data.id}/${Date.now()}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('community-photos')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('community-photos')
              .getPublicUrl(fileName);

            await supabase.from('community_question_photos').insert({
              question_id: data.id,
              photo_url: urlData.publicUrl,
              display_order: i
            });
          }
        }
      }

      toast({
        title: "Question posted!",
        description: "Your question is now visible to the community.",
      });

      return data as Question;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchAnswers = useCallback(async (questionId: string): Promise<Answer[]> => {
    const { data, error } = await supabase
      .from('community_answers')
      .select(`
        *,
        photos:community_answer_photos(*)
      `)
      .eq('question_id', questionId)
      .order('is_accepted', { ascending: false })
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Fetch author profiles separately
    const userIds = [...new Set(data.map(a => a.user_id))];
    const [profilesRes, expertStatsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds),
      supabase
        .from('community_expert_stats')
        .select('user_id, total_answers, accepted_answers, total_upvotes, reputation_score')
        .in('user_id', userIds)
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]) || []);
    const expertStatsMap = new Map(expertStatsRes.data?.map(e => [e.user_id, e]) || []);

    // Get user votes
    if (user) {
      const answerIds = data.map(a => a.id);
      const { data: votes } = await supabase
        .from('community_votes')
        .select('answer_id, vote_type')
        .eq('user_id', user.id)
        .in('answer_id', answerIds);

      const voteMap = new Map(votes?.map(v => [v.answer_id, v.vote_type]) || []);

      return data.map(a => ({
        ...a,
        author: profileMap.get(a.user_id) || null,
        expert_stats: expertStatsMap.get(a.user_id) || null,
        user_vote: voteMap.get(a.id) as 'up' | 'down' | null
      })) as unknown as Answer[];
    }

    return data.map(a => ({
      ...a,
      author: profileMap.get(a.user_id) || null,
      expert_stats: expertStatsMap.get(a.user_id) || null
    })) as unknown as Answer[];
  }, [user]);

  const createAnswer = useCallback(async (
    questionId: string,
    content: string,
    photos?: File[]
  ): Promise<Answer> => {
    if (!user) throw new Error('Must be logged in');

    setLoading(true);
    try {
      // Check if user is a verified professional
      const { data: expertData } = await supabase
        .from('community_expert_stats')
        .select('is_verified_professional')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('community_answers')
        .insert({
          question_id: questionId,
          user_id: user.id,
          content,
          is_verified_pro: expertData?.is_verified_professional || false
        })
        .select()
        .single();

      if (error) throw error;

      // Update question status
      await supabase
        .from('community_questions')
        .update({ status: 'answered' })
        .eq('id', questionId)
        .eq('status', 'open');

      // Upload photos if any
      if (photos && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/answers/${data.id}/${Date.now()}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('community-photos')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('community-photos')
              .getPublicUrl(fileName);

            await supabase.from('community_answer_photos').insert({
              answer_id: data.id,
              photo_url: urlData.publicUrl,
              display_order: i
            });
          }
        }
      }

      toast({
        title: "Answer posted!",
        description: "Thank you for helping the community.",
      });

      return data as Answer;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const voteAnswer = useCallback(async (answerId: string, voteType: 'up' | 'down') => {
    if (!user) throw new Error('Must be logged in');

    // Check existing vote
    const { data: existingVote } = await supabase
      .from('community_votes')
      .select('*')
      .eq('user_id', user.id)
      .eq('answer_id', answerId)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote
        await supabase
          .from('community_votes')
          .delete()
          .eq('id', existingVote.id);
      } else {
        // Change vote
        await supabase
          .from('community_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
      }
    } else {
      // New vote
      await supabase
        .from('community_votes')
        .insert({
          user_id: user.id,
          answer_id: answerId,
          vote_type: voteType
        });
    }
  }, [user]);

  const acceptAnswer = useCallback(async (questionId: string, answerId: string) => {
    if (!user) throw new Error('Must be logged in');

    // Unaccept any previously accepted answer
    await supabase
      .from('community_answers')
      .update({ is_accepted: false })
      .eq('question_id', questionId);

    // Accept this answer
    await supabase
      .from('community_answers')
      .update({ is_accepted: true })
      .eq('id', answerId);

    // Update question status
    await supabase
      .from('community_questions')
      .update({ status: 'resolved' })
      .eq('id', questionId);

    toast({
      title: "Answer accepted!",
      description: "This answer has been marked as the solution.",
    });
  }, [user, toast]);

  const toggleSaveQuestion = useCallback(async (questionId: string, isSaved: boolean) => {
    if (!user) throw new Error('Must be logged in');

    if (isSaved) {
      await supabase
        .from('community_saved_questions')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId);
    } else {
      await supabase
        .from('community_saved_questions')
        .insert({
          user_id: user.id,
          question_id: questionId
        });
    }
  }, [user]);

  const toggleFollowQuestion = useCallback(async (questionId: string, isFollowing: boolean) => {
    if (!user) throw new Error('Must be logged in');

    if (isFollowing) {
      await supabase
        .from('community_question_followers')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId);
    } else {
      await supabase
        .from('community_question_followers')
        .insert({
          user_id: user.id,
          question_id: questionId
        });
    }
  }, [user]);

  const markAsHelped = useCallback(async (questionId: string) => {
    if (!user) throw new Error('Must be logged in');

    const { data: existing } = await supabase
      .from('community_helped')
      .select('id')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .maybeSingle();

    if (!existing) {
      await supabase
        .from('community_helped')
        .insert({
          user_id: user.id,
          question_id: questionId
        });

      toast({
        title: "Marked as helpful!",
        description: "Thanks for letting us know this helped you.",
      });
    }
  }, [user, toast]);

  const fetchLeaderboard = useCallback(async (limit = 10): Promise<ExpertStats[]> => {
    const { data, error } = await supabase
      .from('community_expert_stats')
      .select(`
        *,
        profile:profiles!community_expert_stats_user_id_fkey(full_name, avatar_url)
      `)
      .order('reputation_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ExpertStats[];
  }, []);

  const fetchMyQuestions = useCallback(async (): Promise<Question[]> => {
    if (!user) return [];
    return fetchQuestions({ limit: 100 }).then(questions => 
      questions.filter(q => q.user_id === user.id)
    );
  }, [user, fetchQuestions]);

  const fetchSavedQuestions = useCallback(async (): Promise<Question[]> => {
    if (!user) return [];

    const { data: saved } = await supabase
      .from('community_saved_questions')
      .select('question_id')
      .eq('user_id', user.id);

    if (!saved || saved.length === 0) return [];

    const questionIds = saved.map(s => s.question_id);
    const { data, error } = await supabase
      .from('community_questions')
      .select(`
        *,
        category:community_categories(*)
      `)
      .in('id', questionIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Fetch author profiles separately
    const userIds = [...new Set(data.map(q => q.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]) || []);

    return data.map(q => ({
      ...q,
      author: profileMap.get(q.user_id) || null,
      answer_count: 0,
      is_saved: true
    })) as unknown as Question[];
  }, [user]);

  return {
    loading,
    fetchCategories,
    fetchQuestions,
    fetchQuestion,
    createQuestion,
    fetchAnswers,
    createAnswer,
    voteAnswer,
    acceptAnswer,
    toggleSaveQuestion,
    toggleFollowQuestion,
    markAsHelped,
    fetchLeaderboard,
    fetchMyQuestions,
    fetchSavedQuestions
  };
};
