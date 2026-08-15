import sharp from 'sharp';
import Tesseract from 'tesseract.js';

const CRITICAL_CATEGORIES = ['ID Card', 'Wallet', 'Documents'];

export const extractKeywords = (text) => {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'was', 'were', 'my', 'i', 'it', 'at', 'in', 'on', 'of', 'and', 'or',
  ]);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
};

export const computeImageHash = async (buffer) => {
  try {
    const { data } = await sharp(buffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    return data.map((p) => (p >= avg ? '1' : '0')).join('');
  } catch {
    return '';
  }
};

export const computeImageFeatures = async (buffer) => {
  try {
    const { data, info } = await sharp(buffer)
      .resize(16, 16, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const features = [];
    const channels = info.channels || 3;
    for (let c = 0; c < channels; c++) {
      let sum = 0;
      for (let i = c; i < data.length; i += channels) sum += data[i];
      features.push(sum / (data.length / channels) / 255);
    }

    const gridSize = 4;
    const cellW = Math.floor(info.width / gridSize);
    const cellH = Math.floor(info.height / gridSize);

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        let cellSum = 0;
        let count = 0;
        for (let y = gy * cellH; y < (gy + 1) * cellH && y < info.height; y++) {
          for (let x = gx * cellW; x < (gx + 1) * cellW && x < info.width; x++) {
            const idx = (y * info.width + x) * channels;
            cellSum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            count++;
          }
        }
        features.push(count ? cellSum / count / 255 : 0);
      }
    }

    return features;
  } catch {
    return [];
  }
};

export const hammingDistance = (hash1, hash2) => {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
};

export const cosineSimilarity = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom ? dot / denom : 0;
};

export const computeMatchScore = (source, candidate) => {
  let score = 0;

  if (source.category === candidate.category) score += 25;

  const sourceKeywords = new Set(source.keywords || []);
  const candidateKeywords = new Set(candidate.keywords || []);
  let keywordOverlap = 0;
  sourceKeywords.forEach((k) => {
    if (candidateKeywords.has(k)) keywordOverlap++;
  });
  score += Math.min(keywordOverlap * 5, 25);

  const nameSimilarity = jaccardSimilarity(
    extractKeywords(source.name),
    extractKeywords(candidate.name)
  );
  score += nameSimilarity * 20;

  if (source.imageHash && candidate.imageHash) {
    const dist = hammingDistance(source.imageHash, candidate.imageHash);
    score += Math.max(0, 20 - dist);
  }

  if (source.imageFeatures?.length && candidate.imageFeatures?.length) {
    score += cosineSimilarity(source.imageFeatures, candidate.imageFeatures) * 30;
  }

  if (source.serialNumber && source.serialNumber === candidate.serialNumber) score += 50;
  if (source.barcode && source.barcode === candidate.barcode) score += 50;

  return Math.min(Math.round(score), 100);
};

const jaccardSimilarity = (a, b) => {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size && !setB.size) return 0;
  let intersection = 0;
  setA.forEach((v) => {
    if (setB.has(v)) intersection++;
  });
  return intersection / (setA.size + setB.size - intersection);
};

export const findMatches = async (item, Item) => {
  const oppositeType = item.type === 'lost' ? 'found' : 'lost';
  const candidates = await Item.find({
    type: oppositeType,
    status: { $in: ['lost', 'found'] },
    isApproved: true,
    category: item.category,
  }).limit(50);

  const matches = candidates
    .map((candidate) => ({
      item: candidate,
      score: computeMatchScore(item, candidate),
    }))
    .filter((m) => m.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return matches;
};

export const detectDuplicate = async (item, Item) => {
  const recent = await Item.find({
    postedBy: item.postedBy,
    name: item.name,
    type: item.type,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    _id: { $ne: item._id },
  }).limit(1);

  return recent.length > 0 ? recent[0] : null;
};

export const isEmergencyItem = (category, name) => {
  if (CRITICAL_CATEGORIES.includes(category)) return true;
  const critical = ['passport', 'laptop', 'id card', 'student id', 'wallet', 'phone'];
  const lower = name.toLowerCase();
  return critical.some((c) => lower.includes(c));
};

export const performOCR = async (buffer) => {
  try {
    const { data } = await Tesseract.recognize(buffer, 'eng', {
      logger: () => {},
    });
    return data.text.trim();
  } catch {
    return '';
  }
};

export const generateVerificationQuestions = (item) => {
  const questions = [];

  if (item.description) {
    const words = item.description.split(/\s+/).filter((w) => w.length > 4);
    if (words.length >= 2) {
      questions.push({
        question: `Which word appears in the item description?`,
        answer: words[Math.floor(Math.random() * words.length)].toLowerCase(),
      });
    }
  }

  questions.push({
    question: `What category is this item listed under?`,
    answer: item.category.toLowerCase(),
  });

  if (item.location?.name) {
    const locWords = item.location.name.split(/\s+/).filter((w) => w.length > 3);
    if (locWords.length) {
      questions.push({
        question: `Which location keyword is associated with this item?`,
        answer: locWords[0].toLowerCase(),
      });
    }
  }

  if (item.serialNumber) {
    questions.push({
      question: `What is the serial number of this item?`,
      answer: item.serialNumber.toLowerCase(),
    });
  }

  return questions.slice(0, 3);
};

export const evaluateQuiz = (questions, answers) => {
  if (!questions.length) return { score: 100, passed: true };

  let correct = 0;
  questions.forEach((q, i) => {
    const userAnswer = (answers[i]?.answer || '').toLowerCase().trim();
    const expected = (q.answer || '').toLowerCase().trim();
    if (userAnswer === expected) correct++;
  });

  const score = Math.round((correct / questions.length) * 100);
  return { score, passed: score >= 66 };
};

export const updateUserBadges = (user) => {
  const badges = [...(user.badges || [])];

  if (user.itemsReturned >= 1 && !badges.includes('First Return')) badges.push('First Return');
  if (user.itemsReturned >= 5 && !badges.includes('Helpful Finder')) badges.push('Helpful Finder');
  if (user.itemsReturned >= 10 && !badges.includes('Campus Hero')) badges.push('Campus Hero');
  if (user.itemsFound >= 3 && !badges.includes('Sharp Eye')) badges.push('Sharp Eye');
  if (user.reputation >= 50 && !badges.includes('Trusted Member')) badges.push('Trusted Member');

  return badges;
};
