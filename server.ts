import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import { members, events, attendance, rides } from './src/db/schema.ts';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';
import { eq, and } from 'drizzle-orm';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API: Get initial data (members, events, attendance, rides)
app.get('/api/data', async (_req, res) => {
  try {
    const allMembers = await db.select().from(members);
    const allEvents = await db.select().from(events);
    const allAttendance = await db.select().from(attendance);
    const allRides = await db.select().from(rides);

    // Group attendance and rides by event
    const formattedEvents = allEvents.map((evt) => {
      const eventAttendance = allAttendance
        .filter((a) => a.eventId === evt.id)
        .map((a) => ({
          memberId: a.memberId,
          status: a.status as 'attending' | 'not_attending' | 'maybe',
          updatedAt: a.updatedAt ? a.updatedAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          needsRide: a.needsRide || false,
          rideFrom: a.rideFrom || '',
          note: a.note || '',
        }));

      const eventRides = allRides
        .filter((r) => r.eventId === evt.id)
        .map((r) => ({
          id: r.id,
          memberId: r.memberId,
          memberName: r.memberName,
          fromCity: r.fromCity,
          departureTime: r.departureTime || '',
          totalSeats: r.totalSeats,
          availableSeats: r.availableSeats,
          passengers: [],
          phone: r.phone || '',
          notes: r.notes || '',
        }));

      return {
        ...evt,
        registeredMembers: eventAttendance,
        rides: eventRides,
      };
    });

    res.json({
      members: allMembers,
      events: formattedEvents,
    });
  } catch (error: any) {
    console.error('Failed to query Cloud SQL data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch data from database' });
  }
});

// API: Record attendance in Cloud SQL
app.post('/api/attendance', async (req, res) => {
  try {
    const { eventId, memberId, status, needsRide, rideFrom, note } = req.body;
    if (!eventId || !memberId || !status) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const existing = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.eventId, eventId), eq(attendance.memberId, memberId)));

    if (existing.length > 0) {
      await db
        .update(attendance)
        .set({
          status,
          needsRide: needsRide ?? false,
          rideFrom: rideFrom || null,
          note: note || null,
          updatedAt: new Date(),
        })
        .where(eq(attendance.id, existing[0].id));
    } else {
      await db.insert(attendance).values({
        eventId,
        memberId,
        status,
        needsRide: needsRide ?? false,
        rideFrom: rideFrom || null,
        note: note || null,
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update attendance in Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to update attendance' });
  }
});

// API: Add ride offer in Cloud SQL
app.post('/api/rides', async (req, res) => {
  try {
    const { id, eventId, memberId, memberName, fromCity, departureTime, totalSeats, availableSeats, phone, notes: rideNotes } = req.body;
    if (!id || !eventId || !memberId || !fromCity) {
      return res.status(400).json({ error: 'Missing required ride parameters' });
    }

    await db.insert(rides).values({
      id,
      eventId,
      memberId,
      memberName,
      fromCity,
      departureTime: departureTime || null,
      totalSeats: totalSeats || 3,
      availableSeats: availableSeats || 3,
      phone: phone || null,
      notes: rideNotes || null,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to create ride in Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to save ride' });
  }
});

// API: Add new member in Cloud SQL
app.post('/api/members', async (req, res) => {
  try {
    const { id, name, gender, email, phone, city, gifts, status: memberStatus, allocationSource } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'Missing member id or name' });
    }

    await db.insert(members).values({
      id,
      name,
      gender: gender || 'זכר',
      email: email || null,
      phone: phone || null,
      city: city || null,
      gifts: gifts || null,
      status: memberStatus || 'חבר קמפ',
      allocationSource: allocationSource || 'קיבל מהקמפ',
    }).onConflictDoNothing();

    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to add member to Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to save member' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  // Run seeding asynchronously in the background
  seedDatabaseIfEmpty().catch((err) => console.error('Seeding error:', err));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
