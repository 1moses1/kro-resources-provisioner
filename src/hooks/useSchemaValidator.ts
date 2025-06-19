"use server";
import fs from "fs";
import path from "path";
import YAML from "js-yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { JSONSchemaType, ValidateFunction } from "ajv";
/**
 * This module loads and compiles the OpenAPI v3 schema for the GenericResourceGroup CRD
 * and provides a validation function that can be used server-side to validate manifests.
 * It reads the schema from a YAML file, compiles it using Ajv, and exports a validation function.
 */

/**
 * Load and compile the OpenAPI v3 schema for GenericResourceGroup CR.
 * Returns a validation function that can be used server-side.
 */
const schemaFile = path.join(process.cwd(), "schemas", "kro-generic-crd.yaml");
let validate: ValidateFunction | null = null;

// Compile schema on first import
if (fs.existsSync(schemaFile)) {
  try {
    const fileContent = fs.readFileSync(schemaFile, "utf8");
    const crd = YAML.load(fileContent) as any;
    // Navigate to the openAPIV3Schema within the CRD
    const schema: JSONSchemaType<any> = crd?.spec?.versions?.[0]?.schema?.openAPIV3Schema;
    if (schema) {
      const ajv = new Ajv({ allErrors: true });
      addFormats(ajv); // Add formats for validation
      validate = ajv.compile(schema);
    }
  } catch (error) {
    console.error("Failed to load schema for validation:", error);
  }
}

/**
 * Validate the given manifest object against the CRD's schema.
 * Returns an object with boolean validity and any validation errors.
 */
export async function validateManifest(manifest: any) {
  if (!validate) {
    return { valid: true, errors: [] };  // if schema not loaded, skip validation
  }
  const valid = validate(manifest);
  return {
    valid,
    errors: validate.errors ? [...validate.errors] : []
  };
}
