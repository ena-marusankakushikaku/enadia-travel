import {
  mockConquestEntries,
  mockConquestProjects,
  mockPhotos,
  mockTripMembers,
  mockTrips,
  mockUsers
} from '@/constants/mockData';
import type { ConquestEntry, ConquestProject, Photo, Trip, TripMember, UserProfile } from '@/types/app';

export function getTripById(tripId: string): Trip | null {
  return mockTrips.find((trip) => trip.id === tripId) ?? null;
}

export function getPhotosByTripId(tripId: string): Photo[] {
  return mockPhotos.filter((photo) => photo.tripId === tripId);
}

export function getThemeEntriesByTripId(tripId: string): ConquestEntry[] {
  return mockConquestEntries.filter((entry) => entry.tripId === tripId);
}

export function getConquestProjectById(conquestId: string): ConquestProject | null {
  return mockConquestProjects.find((project) => project.id === conquestId) ?? null;
}

export function getConquestEntriesByPrefecture(prefectureId: number): ConquestEntry[] {
  return mockConquestEntries.filter((entry) => entry.prefectureId === prefectureId);
}

export function getMembersByTripId(tripId: string): TripMember[] {
  return mockTripMembers.filter((member) => member.tripId === tripId);
}

export function getUsersByIds(userIds: string[]): UserProfile[] {
  return userIds
    .map((userId) => mockUsers.find((user) => user.id === userId))
    .filter((user): user is UserProfile => Boolean(user));
}

export function getUserById(userId: string): UserProfile | null {
  return mockUsers.find((user) => user.id === userId) ?? null;
}
