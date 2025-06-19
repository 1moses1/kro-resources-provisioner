"use client";

import React, { useState } from "react";
import YAML from "js-yaml";
import { validateManifest } from "@/hooks/useSchemaValidator";
import Stepper from "@/components/Stepper";
import DynamicForm from "@/components/DynamicForm";
import YamlPreview from "@/components/YamlPreview";
import KeyValueList from "@/components/KeyValueList";

// Define TypeScript types for our form state (matching schema structure)
interface ResourceConfig {
  // Common optional fields for various kinds (additionalProperties allows any extra)
  replicas?: number;
  containers?: any[];  // we will manage containers as needed
  serviceType?: string;
  selector?: Record<string, string>;
  data?: Record<string, string>;
  type?: string;
  accessModes?: string[];
  storage?: string;
  storageClassName?: string;
  ingressClassName?: string;
  tls?: any[];
  rules?: any[];
  schedule?: string;
  concurrencyPolicy?: string;
  suspend?: boolean;
  startingDeadlineSeconds?: number;
  successfulJobsHistoryLimit?: number;
  failedJobsHistoryLimit?: number;
  parallelism?: number;
  completions?: number;
  backoffLimit?: number;
  activeDeadlineSeconds?: number;
  ttlSecondsAfterFinished?: number;
  [key: string]: any; // allow other fields
}
interface ResourceSpec {
  apiVersion: string;
  kind: string;
  nameOverride?: string;
  enabled?: boolean;
  clusterScope?: boolean;
  dependsOn?: string[];
  config: ResourceConfig;
}

export default function HomePage() {
  // Step state: 0 = CR metadata, 1 = group spec metadata, 2 = resources, 3 = review
  const [step, setStep] = useState(0);

  // Step 1: CR (CustomResource) metadata
  const [crName, setCrName] = useState("");  // metadata.name of the CR
  const [crNamespace, setCrNamespace] = useState("default");  // metadata.namespace of the CR

  // Step 2: Group spec metadata (will go under spec.metadata in YAML)
  const [baseName, setBaseName] = useState("");  // spec.metadata.name (required)
  const [baseNamespace, setBaseNamespace] = useState("default");  // spec.metadata.namespace
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [annotations, setAnnotations] = useState<Record<string, string>>({});

  // Step 3: Resources list (each resource spec as per schema)
  const [resources, setResources] = useState<ResourceSpec[]>([]);

  // Track if apply is in progress or done
  const [applyResult, setApplyResult] = useState<{success: boolean; message: string} | null>(null);

  // Helper to construct the manifest object from current state
  const buildManifestObject = (): any => {
    const manifest: any = {
      apiVersion: "kro.run/v1alpha1",
      kind: "GenericResourceGroup",
      metadata: {
        name: crName || "", 
        namespace: crNamespace || "default"
      },
      spec: {
        metadata: {
          name: baseName || "",
          namespace: baseNamespace || "default",
          labels: { ...labels },
          annotations: { ...annotations }
        },
        resources: [] as any[]
      }
    };
    // Construct resources array with proper values, encoding secrets if needed
    resources.forEach((res, idx) => {
      const resCopy: any = { ...res, config: { ...res.config } };

      // Remove empty optional fields from resCopy to keep YAML clean
      if (!resCopy.nameOverride) delete resCopy.nameOverride;
      if (resCopy.enabled === undefined || resCopy.enabled === true) {
        // enabled defaults to true, omit if true to simplify output
        delete resCopy.enabled;
      }
      if (resCopy.clusterScope === undefined || resCopy.clusterScope === false) {
        delete resCopy.clusterScope;
      }
      if (resCopy.dependsOn && resCopy.dependsOn.length === 0) {
        delete resCopy.dependsOn;
      }
      // Remove any empty strings or undefined in config
      for (const key of Object.keys(resCopy.config)) {
        const val = resCopy.config[key];
        if (
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim() === "") ||
          (Array.isArray(val) && val.length === 0) ||
          (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0)
        ) {
          delete resCopy.config[key];
        }
      }
      // Auto-encode Secret data values to base64
      if (resCopy.kind.toLowerCase() === "secret" && resCopy.config.data) {
        const newData: Record<string, string> = {};
        for (const [k, v] of Object.entries(resCopy.config.data)) {
          if (typeof v === "string") {
            // encode plaintext to base64
            const buffer = Buffer.from(v, "utf-8");
            newData[k] = buffer.toString("base64");
          } else {
            newData[k] = v as any;
          }
        }
        resCopy.config.data = newData;
        // If no type provided for Secret, default to Opaque
        if (!resCopy.config.type) {
          resCopy.config.type = "Opaque";
        }
      }
      manifest.spec.resources.push(resCopy);
    });
    return manifest;
  };

  // Generate YAML text for preview from the manifest object
  const manifestObject = buildManifestObject();
  const manifestYAML = YAML.dump(manifestObject, { noRefs: true });

  // Navigation handlers for Next/Back
  const canProceedToNext = (): boolean => {
    if (step === 0) {
      return !!crName;  // CR name must be set
    }
    if (step === 1) {
      return !!baseName;  // base name required by schema:contentReference[oaicite:4]{index=4}
    }
    if (step === 2) {
      return resources.length > 0;  // at least one resource added
    }
    return true;
  };
  const nextStep = () => {
    if (!canProceedToNext()) return;
    setStep((s) => Math.min(s + 1, 3));
    // Reset any apply result when moving from review back to editing
    if (step === 3) {
      setApplyResult(null);
    }
  };
  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 0));
    setApplyResult(null);
  };

  // Handle final apply to cluster
  const handleApply = async () => {
    // Validate manifest against schema before applying
    const validation = validateManifest(manifestObject);
    if (!validation.valid) {
      // If somehow invalid, show errors and abort apply
      const errorMsgs = validation.errors?.map(err => `${err.instancePath} ${err.message}`).join("; ");
      setApplyResult({ success: false, message: "Validation failed: " + errorMsgs });
      return;
    }
    try {
      setApplyResult(null);
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest: manifestYAML })
      });
      const data = await res.json();
      if (data.success) {
        setApplyResult({ success: true, message: data.output || "Applied to cluster successfully." });
      } else {
        setApplyResult({ success: false, message: data.error || "Failed to apply manifest." });
      }
    } catch (err: any) {
      setApplyResult({ success: false, message: err.message || "Error applying manifest." });
    }
  };

  // Helper: update labels/annotations state from child component (KeyValueList)
  const handleUpdateLabels = (newLabels: Record<string, string>) => setLabels(newLabels);
  const handleUpdateAnnotations = (newAnn: Record<string, string>) => setAnnotations(newAnn);

  // Helper: add a new resource (called by DynamicForm when a resource is completed)
  const handleAddResource = (resource: ResourceSpec) => {
    setResources((prev) => [...prev, resource]);
  };
  // Helper: remove a resource by index (in case user wants to delete an entry)
  const handleRemoveResource = (index: number) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  // Determine step content
  let stepContent: React.JSX.Element;
  if (step === 0) {
    // Step 0: CR metadata
    stepContent = (
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Custom Resource Metadata</h2>
        <p className="mb-4 text-gray-700">Provide metadata for the CustomResource (the GenericResourceGroup instance itself):</p>
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Manifest Name <span className="text-red-600">*</span></label>
            <input 
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={crName}
              onChange={(e) => setCrName(e.target.value)}
              placeholder="Name of the CustomResource (e.g. my-app-group)"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Namespace</label>
            <input 
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={crNamespace}
              onChange={(e) => setCrNamespace(e.target.value)}
              placeholder="Namespace for the CR (default if not specified)"
            />
          </div>
        </div>
      </div>
    );
  } else if (step === 1) {
    // Step 1: Group spec metadata
    stepContent = (
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Resource Group Metadata</h2>
        <p className="mb-4 text-gray-700">Provide common metadata applied to all resources in the group (this populates the <code>spec.metadata</code>):</p>
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Base Name <span className="text-red-600">*</span></label>
            <input 
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder="Base name for generated resources"
              required
            />
            <small className="text-gray-500">All resources will be prefixed with this name (and suffixed by kind/index).</small>
          </div>
          <div>
            <label className="block font-medium mb-1">Default Namespace for Resources</label>
            <input 
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={baseNamespace}
              onChange={(e) => setBaseNamespace(e.target.value)}
              placeholder="Namespace for resources (if not cluster-scoped)"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Labels (apply to all resources)</label>
            <KeyValueList 
              entries={Object.entries(labels).map(([k,v]) => ({ key: k, value: v }))}
              onChange={(entries) => {
                const newLabels: Record<string, string> = {};
                entries.forEach(({key, value}) => {
                  if (key) newLabels[key] = value;
                });
                handleUpdateLabels(newLabels);
              }}
              keyPlaceholder="label key"
              valuePlaceholder="label value"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Annotations (apply to all resources)</label>
            <KeyValueList 
              entries={Object.entries(annotations).map(([k,v]) => ({ key: k, value: v }))}
              onChange={(entries) => {
                const newAnn: Record<string, string> = {};
                entries.forEach(({key, value}) => {
                  if (key) newAnn[key] = value;
                });
                handleUpdateAnnotations(newAnn);
              }}
              keyPlaceholder="annotation key"
              valuePlaceholder="annotation value"
            />
          </div>
        </div>
      </div>
    );
  } else if (step === 2) {
    // Step 2: Resources builder
    stepContent = (
      <div>
        <h2 className="text-xl font-semibold mb-4">Define Resources</h2>
        <p className="mb-4 text-gray-700 max-w-2xl">Add one or more Kubernetes resources to include in this group. For each resource, select the Kind and fill in its configuration. You can add multiple resources (e.g., a Deployment, a Service, a ConfigMap, etc.). Use the form below to add resources one by one.</p>
        
        {/* List already added resources */}
        {resources.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Resources Added:</h3>
            <ul className="list-disc list-inside text-gray-800">
              {resources.map((res, idx) => {
                const nameLabel = res.nameOverride || `${baseName}-${res.kind.toLowerCase()}-${idx}`;
                return (
                  <li key={idx} className="mb-1">
                    <span className="font-medium">{res.kind}</span>{" "}
                    <span>({nameLabel})</span>
                    <button 
                      onClick={() => handleRemoveResource(idx)}
                      className="text-red-600 hover:underline ml-2"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Dynamic form to add a new resource */}
        <DynamicForm 
          baseName={baseName || ""} 
          existingResources={resources} 
          onAddResource={handleAddResource} 
        />
      </div>
    );
  } else {
    // Step 3: Review & Apply
    stepContent = (
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-4">Review & Apply</h2>
        <p className="mb-4 text-gray-700">Review the generated YAML manifest below. If everything looks correct, you can apply it to the cluster.</p>
        <div className="flex-1 min-h-0 mb-4 border border-gray-300 rounded-md overflow-auto p-3 bg-black/50">
          {/* YAML preview (syntax-highlighted) */}
          <YamlPreview yaml={manifestYAML} />
        </div>
        {applyResult && (
          <div className={`p-3 mb-4 rounded ${applyResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {applyResult.message}
          </div>
        )}
        <button 
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
        >
          Apply to Cluster
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Horizontal Stepper */}
      <Stepper 
        steps={["CR Metadata", "Group Metadata", "Resources", "Review"]} 
        currentStep={step} 
        onStepSelect={(s) => setStep(s)} 
      />
      <div className="flex-1 mt-6 overflow-y-auto pr-2">
        {stepContent}
      </div>
      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between border-t pt-4">
        {step > 0 ? (
          <button onClick={prevStep} className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50">
            Back
          </button>
        ) : <div />}
        {step < 3 && (
          <button 
            onClick={nextStep} 
            disabled={!canProceedToNext()}
            className={`px-4 py-2 rounded text-white ${canProceedToNext() ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
