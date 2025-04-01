
import { supabase } from '@/integrations/supabase/client';

export async function ensureStorageBucket(bucketName: string, isPublic: boolean = true): Promise<boolean> {
  try {
    console.log(`Ensuring storage bucket "${bucketName}" exists...`);
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error checking if bucket ${bucketName} exists:`, listError);
      
      // Check if the error is due to permissions or initialization
      if (listError.message.includes('not initialized') || 
          listError.message.includes('permission') || 
          listError.message.includes('authorization')) {
        console.warn('Storage API may not be initialized or permissions not set up correctly');
      }
      
      return false;
    }
    
    // If bucket already exists, we're done
    if (buckets && buckets.some(bucket => bucket.name === bucketName)) {
      console.log(`Storage bucket ${bucketName} already exists`);
      return true;
    }
    
    // Create the bucket if it doesn't exist
    console.log(`Creating storage bucket ${bucketName}`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
    });
    
    if (error) {
      console.error(`Error creating bucket ${bucketName}:`, error);
      
      // Check for specific errors
      if (error.message.includes('already exists')) {
        console.log(`Bucket ${bucketName} already exists (race condition)`);
        return true;
      }
      
      return false;
    }
    
    console.log(`Successfully created storage bucket ${bucketName}`);
    return true;
  } catch (error) {
    console.error(`Unexpected error ensuring bucket ${bucketName} exists:`, error);
    return false;
  }
}
