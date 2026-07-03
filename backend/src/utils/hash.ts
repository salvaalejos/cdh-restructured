import * as crypto from 'crypto';

export function verifyWerkzeugHash(password: string, hashString: string): boolean {
    const parts = hashString.split('$');
    if (parts.length !== 3) return false;
    
    const methodStr = parts[0];
    const salt = parts[1];
    const hash = parts[2];
    
    const methodParts = methodStr.split(':');
    if (methodParts[0] !== 'pbkdf2') return false;
    
    const hashName = methodParts[1] || 'sha256';
    
    const defaultIterations = [600000, 260000, 150000, 50000];
    let iterationsToCheck: number[] = [];
    
    if (methodParts.length === 3) {
        iterationsToCheck.push(parseInt(methodParts[2], 10));
    } else {
        iterationsToCheck = defaultIterations;
    }
    
    try {
        const hashBuffer = Buffer.from(hash, 'hex');
        const keyLength = hashBuffer.length; 
        
        for (const iterations of iterationsToCheck) {
            try {
                const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, hashName);
                if (crypto.timingSafeEqual(key, hashBuffer)) {
                    return true;
                }
            } catch (e) {
                continue;
            }
        }
    } catch(e) {
        return false;
    }
    
    return false;
}

export async function verifyPassword(password: string, hashString: string): Promise<boolean> {
    // Check if it's a legacy Python hash
    if (hashString.startsWith('pbkdf2:sha256')) {
        return verifyWerkzeugHash(password, hashString);
    }
    
    // Modern Bun native Argon2id hash verification
    return await Bun.password.verify(password, hashString);
}

export async function hashPassword(password: string): Promise<string> {
    // Uses Argon2id by default in Bun, highly secure and modern
    return await Bun.password.hash(password);
}
