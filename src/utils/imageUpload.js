import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import config from '../config/env.js';

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

class ImageUpload {
    static async uploadExternalImage(imageUrl, folder = 'louderworld_events') {
        // Temporarily bypassed because local .env does not have valid Cloudinary credentials set up.
        // It will just store the original Unsplash URLs in the DB for now.
        return imageUrl;
    }
}

export default ImageUpload;
