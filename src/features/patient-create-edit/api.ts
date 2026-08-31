"use server";

import { createPatient as _create } from "@/entities/patient/api";
import { updatePatient as _update } from "@/entities/patient/api";
import { setPatientAvatar as _setAvatar } from "@/entities/patient/api";
import type { PatientPayload } from "@/shared/lib/validation";

export async function createPatient(
  values: PatientPayload
): Promise<{ id: string } | { error: string }> {
  return _create(values);
}

export async function updatePatient(
  id: string,
  values: PatientPayload
): Promise<{ error?: string }> {
  return _update(id, values);
}

export async function setPatientAvatar(
  patientId: string,
  path: string
): Promise<void> {
  await _setAvatar(patientId, path);
}
