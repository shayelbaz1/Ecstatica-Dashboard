import { db } from './index.ts';
import { members, events, attendance, rides } from './schema.ts';
import { INITIAL_MEMBERS, INITIAL_EVENTS } from '../data/initialData.ts';
import { count } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    const memberCountRes = await db.select({ value: count() }).from(members);
    const existingCount = Number(memberCountRes[0]?.value || 0);

    if (existingCount === 0) {
      console.log('Seeding initial camp members into Cloud SQL...');
      for (const m of INITIAL_MEMBERS) {
        await db.insert(members).values({
          id: m.id,
          name: m.name,
          gender: m.gender,
          email: m.email || null,
          idNumber: m.idNumber || null,
          city: m.city || null,
          phone: m.phone || null,
          insta: m.insta || null,
          gifts: m.gifts || null,
          status: m.status,
          allocationSource: m.allocationSource || null,
          notes: m.notes || null,
        }).onConflictDoNothing();
      }

      console.log('Seeding initial events into Cloud SQL...');
      for (const e of INITIAL_EVENTS) {
        await db.insert(events).values({
          id: e.id,
          title: e.title,
          subTitle: e.subTitle || null,
          dateStr: e.dateStr,
          category: e.category,
          location: e.location,
          description: e.description,
          targetParticipants: e.targetParticipants,
        }).onConflictDoNothing();

        // Seed initial attendance for each event
        for (const reg of e.registeredMembers) {
          await db.insert(attendance).values({
            eventId: e.id,
            memberId: reg.memberId,
            status: reg.status,
            needsRide: reg.needsRide || false,
            rideFrom: reg.rideFrom || null,
            note: reg.note || null,
          }).onConflictDoNothing();
        }

        // Seed initial rides
        for (const r of e.rides) {
          await db.insert(rides).values({
            id: r.id,
            eventId: e.id,
            memberId: r.memberId,
            memberName: r.memberName,
            fromCity: r.fromCity,
            departureTime: r.departureTime || null,
            totalSeats: r.totalSeats,
            availableSeats: r.availableSeats,
            phone: r.phone || null,
            notes: r.notes || null,
          }).onConflictDoNothing();
        }
      }
      console.log('Cloud SQL initial seeding completed successfully!');
    }
  } catch (error) {
    console.error('Error during initial database seeding:', error);
  }
}
