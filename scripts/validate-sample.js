#!/usr/bin/env node
const { readFileSync } = require('fs');
const { resolve } = require('path');

const dicePattern = /^\d+D(\+\d)?$/i;
const movePattern = /^\d+(\/\d+)?$/;

const filePath = resolve(process.cwd(), 'ALIENS.json');
const SAMPLE_COUNT = 5;

const raw = readFileSync(filePath, 'utf-8');
const payload = JSON.parse(raw);
const records = Array.isArray(payload) ? payload : payload?.races;

if (!Array.isArray(records) || records.length === 0) {
  throw new Error('ALIENS.json must contain an array of species records under "races"');
}

const sample = records.slice(0, SAMPLE_COUNT);

sample.forEach((record, index) => {
  const id = record?.name ?? `record-${index}`;

  if (typeof record?.name !== 'string' || record.name.trim().length === 0) {
    throw new Error(`Record ${index} (${id}) is missing a valid name`);
  }

  if (
    typeof record?.description !== 'string' ||
    record.description.trim().length === 0
  ) {
    throw new Error(`Record ${id} requires a description`);
  }

  if (
    typeof record?.languages?.native !== 'string' ||
    record.languages.native.trim().length === 0 ||
    typeof record?.languages?.description !== 'string' ||
    record.languages.description.trim().length === 0
  ) {
    throw new Error(`Record ${id} has incomplete language details`);
  }

  if (!Array.isArray(record?.sources) || record.sources.length === 0) {
    throw new Error(`Record ${id} must include at least one source`);
  }

  const stats = record?.stats;
  if (!stats || typeof stats !== 'object') {
    throw new Error(`Record ${id} is missing stats`);
  }

  if (
    typeof stats.attributeDice !== 'string' ||
    !dicePattern.test(stats.attributeDice)
  ) {
    throw new Error(`Record ${id} has invalid attributeDice value`);
  }

  if (typeof stats.move !== 'string' || !movePattern.test(stats.move)) {
    throw new Error(`Record ${id} has invalid move value`);
  }

  if (typeof stats.size !== 'string' || stats.size.trim().length === 0) {
    throw new Error(`Record ${id} requires a size value`);
  }
});

console.log(`✅ Validated ${sample.length} sample species records successfully.`);
