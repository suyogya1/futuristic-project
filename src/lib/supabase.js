import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const imageService = {
  async getAllImages() {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getImageById(id) {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createImage(imageData) {
    const { data, error } = await supabase
      .from('images')
      .insert([{
        image_url: imageData.image_url,
        message: imageData.message,
        token_number: imageData.token_number,
        wallet_address: imageData.wallet_address,
        status: 'approved'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async voteForImage(imageId, walletAddress) {
    const { data, error } = await supabase
      .from('image_votes')
      .insert([{
        image_id: imageId,
        wallet_address: walletAddress
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('You have already voted for this image');
      }
      throw error;
    }
    return data;
  },

  async removeVote(imageId, walletAddress) {
    const { error } = await supabase
      .from('image_votes')
      .delete()
      .eq('image_id', imageId)
      .eq('wallet_address', walletAddress);

    if (error) throw error;
  },

  async hasUserVoted(imageId, walletAddress) {
    const { data, error } = await supabase
      .from('image_votes')
      .select('id')
      .eq('image_id', imageId)
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async getTopImages(limit = 10) {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('status', 'approved')
      .order('votes', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  subscribeToImages(callback) {
    return supabase
      .channel('images-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'images'
      }, callback)
      .subscribe();
  }
};
