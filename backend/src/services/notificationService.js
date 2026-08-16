//notification service fot notifications 
import admin from 'firebase-admin';
import Notification from '../models/Notification.js';

let initialized = false;

const initFirebase = () => {
  if (initialized) return !!admin.apps.length;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    initialized = true;
    return true;
  } catch (err) {
    console.warn('Firebase init failed:', err.message);
    return false;
  }
};

export const sendPushNotification = async (user, { title, body, link }) => {
  if (!initFirebase() || !user.fcmTokens?.length) return;

  try {
    await admin.messaging().sendEachForMulticast({
      tokens: user.fcmTokens,
      notification: { title, body },
      data: { link: link || '' },
    });
  } catch (err) {
    console.warn('FCM send failed:', err.message);
  }
};

export const createNotification = async (userId, { type, title, message, link, relatedItem }) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link,
    relatedItem,
  });

  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);

  if (user) {
    await sendPushNotification(user, { title, body: message, link });
  }

  return notification;
};

export const notifyMultiple = async (userIds, payload) => {
  await Promise.all(userIds.map((id) => createNotification(id, payload)));
};
