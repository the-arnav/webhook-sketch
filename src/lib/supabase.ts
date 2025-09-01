
import { supabase } from '@/integrations/supabase/client';
import type { Node, Edge } from '@xyflow/react';

export interface Canvas {
  id: string;
  title: string;
  subject?: string;
  data: {
    nodes: Node[];
    edges: Edge[];
  };
  user_id: string;
  tags?: string[];
  pinned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCanvasData {
  title: string;
  subject?: string;
  data: {
    nodes: Node[];
    edges: Edge[];
  };
  tags?: string[];
}

export interface UpdateCanvasData {
  title?: string;
  subject?: string;
  data?: {
    nodes: Node[];
    edges: Edge[];
  };
  tags?: string[];
  pinned?: boolean;
}

export async function saveCanvas(canvasData: CreateCanvasData): Promise<Canvas | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to save canvas');
    }

    const { data, error } = await supabase
      .from('canvases')
      .insert({
        title: canvasData.title,
        subject: canvasData.subject,
        data: canvasData.data as any, // Type assertion for Json compatibility
        user_id: user.id,
        tags: canvasData.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving canvas:', error);
      throw error;
    }

    // Convert the returned data to Canvas type
    return {
      ...data,
      data: data.data as unknown as { nodes: Node[]; edges: Edge[] }
    } as Canvas;
  } catch (error) {
    console.error('Failed to save canvas:', error);
    return null;
  }
}

export async function updateCanvas(id: string, updates: UpdateCanvasData): Promise<Canvas | null> {
  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Convert data field to Json if it exists
    if (updates.data) {
      updateData.data = updates.data as any;
    }

    const { data, error } = await supabase
      .from('canvases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating canvas:', error);
      throw error;
    }

    // Convert the returned data to Canvas type
    return {
      ...data,
      data: data.data as unknown as { nodes: Node[]; edges: Edge[] }
    } as Canvas;
  } catch (error) {
    console.error('Failed to update canvas:', error);
    return null;
  }
}

export async function getCanvases(): Promise<Canvas[]> {
  try {
    const { data, error } = await supabase
      .from('canvases')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching canvases:', error);
      throw error;
    }

    // Convert the returned data to Canvas[] type
    return (data || []).map(item => ({
      ...item,
      data: item.data as unknown as { nodes: Node[]; edges: Edge[] }
    })) as Canvas[];
  } catch (error) {
    console.error('Failed to fetch canvases:', error);
    return [];
  }
}

export async function getCanvas(id: string): Promise<Canvas | null> {
  try {
    const { data, error } = await supabase
      .from('canvases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching canvas:', error);
      throw error;
    }

    // Convert the returned data to Canvas type
    return {
      ...data,
      data: data.data as unknown as { nodes: Node[]; edges: Edge[] }
    } as Canvas;
  } catch (error) {
    console.error('Failed to fetch canvas:', error);
    return null;
  }
}

export async function deleteCanvas(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('canvases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting canvas:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete canvas:', error);
    return false;
  }
}

export async function togglePinCanvas(id: string): Promise<boolean> {
  try {
    // First get the current pinned status
    const { data: canvas, error: fetchError } = await supabase
      .from('canvases')
      .select('pinned')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Toggle the pinned status
    const { error: updateError } = await supabase
      .from('canvases')
      .update({ 
        pinned: !canvas.pinned,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Failed to toggle pin canvas:', error);
    return false;
  }
}

export async function searchCanvases(query: string): Promise<Canvas[]> {
  try {
    const { data, error } = await supabase
      .from('canvases')
      .select('*')
      .or(`title.ilike.%${query}%, subject.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error searching canvases:', error);
      throw error;
    }

    // Convert the returned data to Canvas[] type
    return (data || []).map(item => ({
      ...item,
      data: item.data as unknown as { nodes: Node[]; edges: Edge[] }
    })) as Canvas[];
  } catch (error) {
    console.error('Failed to search canvases:', error);
    return [];
  }
}
