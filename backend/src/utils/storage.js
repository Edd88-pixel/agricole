import { randomUUID } from 'crypto';
import { supabaseService } from '../services/supabaseService.js';

const inferExtension = (filename) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'bin';
};

const buildPath = (owner, file) =>
  `${owner || 'anonymous'}/${Date.now()}-${randomUUID()}.${inferExtension(file.originalname)}`;

export const uploadFilesToBucket = async (files = [], bucket, owner) => {
  const uploaded = [];

  for (const file of files) {
    const path = buildPath(owner, file);
    await supabaseService.uploadToBucket({
      bucket,
      path,
      body: file.buffer,
      contentType: file.mimetype || 'application/octet-stream'
    });
    uploaded.push(path);
  }

  return uploaded;
};
