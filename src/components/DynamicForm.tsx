"use client";
import React, { useState, useMemo } from "react";
import KeyValueList from "@/components/KeyValueList";

// Lists of known options for certain fields
const serviceTypes = ["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"];
const concurrencyOptions = ["Allow", "Forbid", "Replace"];
const accessModeOptions = ["ReadWriteOnce", "ReadOnlyMany", "ReadWriteMany"];

interface DynamicFormProps {
  baseName: string;  // base name for computing default resource names
  existingResources: Array<{ kind: string; nameOverride?: string }>;
  onAddResource: (res: any) => void;
}

export default function DynamicForm({ baseName, existingResources, onAddResource }: DynamicFormProps) {
  // Resource being built
  const [apiVersion, setApiVersion] = useState<string>("");
  const [kind, setKind] = useState<string>("");
  const [nameOverride, setNameOverride] = useState<string>("");
  const [enabled, setEnabled] = useState<boolean>(true);
  const [clusterScope, setClusterScope] = useState<boolean>(false);
  const [dependsOn, setDependsOn] = useState<string[]>([]);

  // Config fields (many are optional)
  const [replicas, setReplicas] = useState<number | undefined>();
  const [containers, setContainers] = useState<any[]>([]);
  const [serviceType, setServiceType] = useState<string>("");
  const [selector, setSelector] = useState<Record<string, string>>({});
  const [dataFields, setDataFields] = useState<Record<string, string>>({});
  const [secretType, setSecretType] = useState<string>("");
  const [accessModes, setAccessModes] = useState<string[]>([]);
  const [storage, setStorage] = useState<string>("");
  const [storageClassName, setStorageClassName] = useState<string>("");
  const [ingressClassName, setIngressClassName] = useState<string>("");
  const [tls, setTls] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<string>("");
  const [concurrencyPolicy, setConcurrencyPolicy] = useState<string>("");
  const [suspend, setSuspend] = useState<boolean>(false);
  const [startingDeadlineSeconds, setStartingDeadlineSeconds] = useState<number | undefined>();
  const [successfulJobsHistoryLimit, setSuccessfulJobsHistoryLimit] = useState<number | undefined>();
  const [failedJobsHistoryLimit, setFailedJobsHistoryLimit] = useState<number | undefined>();
  const [parallelism, setParallelism] = useState<number | undefined>();
  const [completions, setCompletions] = useState<number | undefined>();
  const [backoffLimit, setBackoffLimit] = useState<number | undefined>();
  const [activeDeadlineSeconds, setActiveDeadlineSeconds] = useState<number | undefined>();
  const [ttlSecondsAfterFinished, setTtlSecondsAfterFinished] = useState<number | undefined>();

  // Reset form fields after adding a resource
  const resetForm = () => {
    setApiVersion("");
    setKind("");
    setNameOverride("");
    setEnabled(true);
    setClusterScope(false);
    setDependsOn([]);
    setReplicas(undefined);
    setContainers([]);
    setServiceType("");
    setSelector({});
    setDataFields({});
    setSecretType("");
    setAccessModes([]);
    setStorage("");
    setStorageClassName("");
    setIngressClassName("");
    setTls([]);
    setRules([]);
    setSchedule("");
    setConcurrencyPolicy("");
    setSuspend(false);
    setStartingDeadlineSeconds(undefined);
    setSuccessfulJobsHistoryLimit(undefined);
    setFailedJobsHistoryLimit(undefined);
    setParallelism(undefined);
    setCompletions(undefined);
    setBackoffLimit(undefined);
    setActiveDeadlineSeconds(undefined);
    setTtlSecondsAfterFinished(undefined);
  };

  const handleAdd = () => {
    if (!apiVersion || !kind) {
      return; // required fields
    }
    const resource: any = {
      apiVersion,
      kind,
      config: {}
    };
    if (nameOverride.trim()) resource.nameOverride = nameOverride.trim();
    if (enabled === false) resource.enabled = false;
    if (clusterScope === true) resource.clusterScope = true;
    if (dependsOn.length > 0) resource.dependsOn = [...dependsOn];
    // Build config object based on filled fields
    if (replicas !== undefined) resource.config.replicas = replicas;
    if (containers.length > 0) resource.config.containers = [...containers];
    if (serviceType) resource.config.serviceType = serviceType;
    if (Object.keys(selector).length > 0) resource.config.selector = { ...selector };
    if (Object.keys(dataFields).length > 0) resource.config.data = { ...dataFields };
    if (secretType) resource.config.type = secretType;
    if (accessModes.length > 0) resource.config.accessModes = [...accessModes];
    if (storage) resource.config.storage = storage;
    if (storageClassName) resource.config.storageClassName = storageClassName;
    if (ingressClassName) resource.config.ingressClassName = ingressClassName;
    if (tls.length > 0) resource.config.tls = [...tls];
    if (rules.length > 0) resource.config.rules = [...rules];
    if (schedule) resource.config.schedule = schedule;
    if (concurrencyPolicy) resource.config.concurrencyPolicy = concurrencyPolicy;
    if (suspend === true) resource.config.suspend = true;
    if (startingDeadlineSeconds !== undefined) resource.config.startingDeadlineSeconds = startingDeadlineSeconds;
    if (successfulJobsHistoryLimit !== undefined) resource.config.successfulJobsHistoryLimit = successfulJobsHistoryLimit;
    if (failedJobsHistoryLimit !== undefined) resource.config.failedJobsHistoryLimit = failedJobsHistoryLimit;
    if (parallelism !== undefined) resource.config.parallelism = parallelism;
    if (completions !== undefined) resource.config.completions = completions;
    if (backoffLimit !== undefined) resource.config.backoffLimit = backoffLimit;
    if (activeDeadlineSeconds !== undefined) resource.config.activeDeadlineSeconds = activeDeadlineSeconds;
    if (ttlSecondsAfterFinished !== undefined) resource.config.ttlSecondsAfterFinished = ttlSecondsAfterFinished;
    // AdditionalProperties: if user added unknown fields via advanced usage (not in this UI), they'd be in resource.config already.

    onAddResource(resource);
    resetForm();
  };

  // Handlers for nested dynamic fields (containers, ports, env, etc.)
  const addContainer = () => {
    setContainers(prev => [...prev, {
      name: "",
      image: "",
      ports: [] as any[],
      env: [] as any[],
      resources: { requests: {}, limits: {} }
    }]);
  };
  const removeContainer = (index: number) => {
    setContainers(prev => prev.filter((_, i) => i !== index));
  };
  const updateContainerField = (index: number, field: string, value: any) => {
    setContainers(prev => {
      const updated = [...prev];
      if (!updated[index]) return updated;
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addContainerPort = (containerIndex: number) => {
    setContainers(prev => {
      const updated = [...prev];
      const cont = { ...updated[containerIndex] };
      cont.ports = cont.ports ? [...cont.ports] : [];
      cont.ports.push({ containerPort: 0, protocol: "TCP" });
      updated[containerIndex] = cont;
      return updated;
    });
  };
  const removeContainerPort = (containerIndex: number, portIndex: number) => {
    setContainers(prev => {
      const updated = [...prev];
      const cont = { ...updated[containerIndex] };
      cont.ports = cont.ports.filter((_: any, i: number) => i !== portIndex);
      updated[containerIndex] = cont;
      return updated;
    });
  };
  const updateContainerPort = (containerIndex: number, portIndex: number, field: "containerPort" | "port" | "protocol", value: string) => {
    setContainers(prev => {
      const updated = [...prev];
      const cont = { ...updated[containerIndex] };
      const portsArr = cont.ports || [];
      const portObj = { ...portsArr[portIndex] };
      if (field === "containerPort" || field === "port") {
        // parse numeric value
        portObj[field] = value === "" ? "" : Number(value);
      } else {
        portObj[field] = value;
      }
      portsArr[portIndex] = portObj;
      cont.ports = portsArr;
      updated[containerIndex] = cont;
      return updated;
    });
  };
  const updateContainerEnv = (containerIndex: number, envEntries: { key: string; value: string }[]) => {
    setContainers(prev => {
      const updated = [...prev];
      const envArray = envEntries
        .filter(e => e.key)  // ignore empty keys
        .map(e => ({ name: e.key, value: e.value }));
      if (!updated[containerIndex]) return updated;
      updated[containerIndex] = { ...updated[containerIndex], env: envArray };
      return updated;
    });
  };
  const toggleResourceLimits = (containerIndex: number, category: "requests" | "limits", resKey: "cpu" | "memory", val: string) => {
    setContainers(prev => {
      const updated = [...prev];
      const cont = { ...updated[containerIndex] };
      const resObj = cont.resources ? { ...cont.resources } : { requests: {}, limits: {} };
      resObj[category] = { ...resObj[category as "requests" | "limits"], [resKey]: val };
      cont.resources = resObj;
      updated[containerIndex] = cont;
      return updated;
    });
  };

  // Determine which fields to show based on kind
  const kindLower = kind.toLowerCase();
  const isWorkload = ["deployment", "statefulset", "daemonset", "replicaset", "job", "cronjob"].includes(kindLower);
  const isCronJob = kindLower === "cronjob";
  const isJob = kindLower === "job";
  const isService = kindLower === "service";
  const isConfigMap = kindLower === "configmap";
  const isSecret = kindLower === "secret";
  const isPVC = kindLower === "persistentvolumeclaim";
  const isIngress = kindLower === "ingress";

  // Prepare options for dependsOn (existing resource names)
  const dependsOnOptions = existingResources.map((res, idx) => {
    const defaultName = `${baseName}-${res.kind.toLowerCase()}-${idx}`;
    const actualName = res.nameOverride?.trim() ? res.nameOverride.trim() : defaultName;
    return actualName;
  });

  return (
    <div className="p-4 border border-gray-300 rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic fields: API version, kind, nameOverride, enabled, clusterScope */}
        <div>
          <label className="block font-medium mb-1">API Version <span className="text-red-600">*</span></label>
          <input 
            type="text" 
            className="w-full border rounded px-2 py-1"
            value={apiVersion}
            onChange={(e) => setApiVersion(e.target.value)}
            placeholder="e.g. apps/v1"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Kind <span className="text-red-600">*</span></label>
          <input 
            type="text" 
            className="w-full border rounded px-2 py-1"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            placeholder="e.g. Deployment"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Name Override</label>
          <input 
            type="text"
            className="w-full border rounded px-2 py-1"
            value={nameOverride}
            onChange={(e) => setNameOverride(e.target.value)}
            placeholder="Explicit name for this resource"
          />
        </div>
        <div className="flex items-center mt-6">
          <input 
            id="enabledCheck" 
            type="checkbox" 
            className="mr-2" 
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)} 
          />
          <label htmlFor="enabledCheck" className="font-medium">Enabled</label>
        </div>
        <div className="flex items-center mt-6">
          <input 
            id="clusterScopeCheck" 
            type="checkbox" 
            className="mr-2" 
            checked={clusterScope}
            onChange={(e) => setClusterScope(e.target.checked)} 
          />
          <label htmlFor="clusterScopeCheck" className="font-medium">Cluster Scope</label>
        </div>
        <div>
          <label className="block font-medium mb-1">Depends On</label>
          <select 
            multiple 
            className="w-full border rounded px-2 py-1"
            value={dependsOn}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, opt => opt.value);
              setDependsOn(selected);
            }}
          >
            {dependsOnOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <small className="text-gray-500">Select other resources (by name) that must be created before this one.</small>
        </div>
      </div>

      {/* Config section (dynamic fields based on kind) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="font-medium mb-3">Configuration for {kind || "..."}</h4>
        {/* Workload fields (Deployment, StatefulSet, Job, CronJob, etc.) */}
        {isWorkload && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium mb-1">Replicas</label>
              <input 
                type="number" 
                className="w-full border rounded px-2 py-1"
                value={replicas ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setReplicas(val === "" ? undefined : Number(val));
                }}
                placeholder="Number of replicas (if applicable)"
                min={0}
              />
            </div>
            {/* For CronJob: schedule field */}
            {isCronJob && (
              <div>
                <label className="block font-medium mb-1">Schedule (Cron)</label>
                <input 
                  type="text" 
                  className="w-full border rounded px-2 py-1"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g. 0 0 * * *"
                />
              </div>
            )}
            {/* CronJob concurrencyPolicy */}
            {isCronJob && (
              <div>
                <label className="block font-medium mb-1">Concurrency Policy</label>
                <select 
                  className="w-full border rounded px-2 py-1"
                  value={concurrencyPolicy}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setConcurrencyPolicy("");
                    } else {
                      setConcurrencyPolicy(val);
                    }
                  }}
                >
                  <option value="">(default: Allow)</option>
                  {concurrencyOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
            {isCronJob && (
              <div className="flex items-center mt-6">
                <input 
                  id="suspendCheck" 
                  type="checkbox" 
                  className="mr-2"
                  checked={suspend}
                  onChange={(e) => setSuspend(e.target.checked)} 
                />
                <label htmlFor="suspendCheck" className="font-medium">Suspend CronJob</label>
              </div>
            )}
            {/* CronJob history limits */}
            {isCronJob && (
              <div>
                <label className="block font-medium mb-1">Successful Jobs History Limit</label>
                <input 
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={successfulJobsHistoryLimit ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSuccessfulJobsHistoryLimit(val === "" ? undefined : Number(val));
                  }}
                  min={0}
                />
              </div>
            )}
            {isCronJob && (
              <div>
                <label className="block font-medium mb-1">Failed Jobs History Limit</label>
                <input 
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={failedJobsHistoryLimit ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFailedJobsHistoryLimit(val === "" ? undefined : Number(val));
                  }}
                  min={0}
                />
              </div>
            )}
            {/* Job fields (also apply to CronJob template) */}
            {(isJob || isCronJob) && (
              <>
                <div>
                  <label className="block font-medium mb-1">Parallelism</label>
                  <input 
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={parallelism ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParallelism(val === "" ? undefined : Number(val));
                    }}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Completions</label>
                  <input 
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={completions ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompletions(val === "" ? undefined : Number(val));
                    }}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Backoff Limit</label>
                  <input 
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={backoffLimit ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBackoffLimit(val === "" ? undefined : Number(val));
                    }}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Active Deadline Seconds</label>
                  <input 
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={activeDeadlineSeconds ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveDeadlineSeconds(val === "" ? undefined : Number(val));
                    }}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">TTL Seconds After Finished</label>
                  <input 
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={ttlSecondsAfterFinished ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTtlSecondsAfterFinished(val === "" ? undefined : Number(val));
                    }}
                    min={0}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Container definitions (for Pod-spec carrying kinds) */}
        {isWorkload && (
          <div className="mb-4">
            <label className="block font-medium">Containers</label>
            {containers.map((container, idx) => (
              <div key={idx} className="border border-gray-300 p-3 rounded mb-3">
                <div className="flex justify-between items-center mb-2">
                  <strong>Container {idx + 1}</strong>
                  <button onClick={() => removeContainer(idx)} className="text-red-600 text-sm">Remove</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input 
                      type="text"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={container.name}
                      onChange={(e) => updateContainerField(idx, "name", e.target.value)}
                      placeholder="container name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Image</label>
                    <input 
                      type="text"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={container.image}
                      onChange={(e) => updateContainerField(idx, "image", e.target.value)}
                      placeholder="image:tag"
                    />
                  </div>
                </div>
                {/* Container Ports */}
                <div className="mb-2">
                  <label className="block text-sm font-medium">Ports</label>
                  {container.ports?.map((portObj: any, pIndex: number) => (
                    <div key={pIndex} className="flex items-center space-x-2 mb-1">
                      <input 
                        type="number"
                        className="w-20 border rounded px-1 py-0.5 text-sm"
                        value={portObj.containerPort ?? ""}
                        onChange={(e) => updateContainerPort(idx, pIndex, "containerPort", e.target.value)}
                        placeholder="container"
                        min={1}
                        max={65535}
                      />
                      <input 
                        type="number"
                        className="w-20 border rounded px-1 py-0.5 text-sm"
                        value={portObj.port ?? ""}
                        onChange={(e) => updateContainerPort(idx, pIndex, "port", e.target.value)}
                        placeholder="service"
                        min={1}
                        max={65535}
                      />
                      <select 
                        className="border rounded px-1 py-0.5 text-sm"
                        value={portObj.protocol || "TCP"}
                        onChange={(e) => updateContainerPort(idx, pIndex, "protocol", e.target.value)}
                      >
                        <option value="TCP">TCP</option>
                        <option value="UDP">UDP</option>
                        <option value="SCTP">SCTP</option>
                      </select>
                      <button onClick={() => removeContainerPort(idx, pIndex)} className="text-red-600 text-xs ml-1">Remove</button>
                    </div>
                  ))}
                  <button onClick={() => addContainerPort(idx)} className="text-blue-600 text-sm mt-1">+ Add Port</button>
                </div>
                {/* Environment Variables */}
                <div className="mb-2">
                  <label className="block text-sm font-medium">Environment Variables</label>
                  <KeyValueList 
                    entries={container.env ? container.env.map((e: any) => ({ key: e.name, value: e.value ?? "" })) : []}
                    onChange={(entries) => updateContainerEnv(idx, entries)}
                    keyPlaceholder="ENV_VAR"
                    valuePlaceholder="value"
                  />
                </div>
                {/* Resource Requests/Limits */}
                <div>
                  <label className="block text-sm font-medium">Resource Requests & Limits</label>
                  <div className="flex space-x-2 items-center text-xs mt-1">
                    <div className="flex-1">
                      <label className="block text-gray-600">CPU Request</label>
                      <input 
                        type="text"
                        className="w-full border rounded px-1 py-0.5"
                        value={container.resources?.requests?.cpu || ""}
                        onChange={(e) => toggleResourceLimits(idx, "requests", "cpu", e.target.value)}
                        placeholder="e.g. 100m"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-gray-600">Memory Request</label>
                      <input 
                        type="text"
                        className="w-full border rounded px-1 py-0.5"
                        value={container.resources?.requests?.memory || ""}
                        onChange={(e) => toggleResourceLimits(idx, "requests", "memory", e.target.value)}
                        placeholder="e.g. 128Mi"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 items-center text-xs mt-1">
                    <div className="flex-1">
                      <label className="block text-gray-600">CPU Limit</label>
                      <input 
                        type="text"
                        className="w-full border rounded px-1 py-0.5"
                        value={container.resources?.limits?.cpu || ""}
                        onChange={(e) => toggleResourceLimits(idx, "limits", "cpu", e.target.value)}
                        placeholder="e.g. 500m"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-gray-600">Memory Limit</label>
                      <input 
                        type="text"
                        className="w-full border rounded px-1 py-0.5"
                        value={container.resources?.limits?.memory || ""}
                        onChange={(e) => toggleResourceLimits(idx, "limits", "memory", e.target.value)}
                        placeholder="e.g. 512Mi"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addContainer} className="text-blue-600 text-sm">+ Add Container</button>
          </div>
        )}

        {/* Service fields */}
        {isService && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium mb-1">Service Type</label>
              <select 
                className="w-full border rounded px-2 py-1"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                <option value="">ClusterIP (default)</option>
                {serviceTypes.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Selector Labels</label>
              <KeyValueList 
                entries={Object.entries(selector).map(([k,v]) => ({ key: k, value: v }))}
                onChange={(entries) => {
                  const newSel: Record<string, string> = {};
                  entries.forEach(({ key, value }) => { if (key) newSel[key] = value; });
                  setSelector(newSel);
                }}
                keyPlaceholder="label"
                valuePlaceholder="value"
              />
              <small className="text-gray-500">Labels to identify target pods (defaults to app name if not set).</small>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Note: Service ports can be defined in the container specs above (the builder will map them automatically in the Service manifest).</p>
            </div>
          </div>
        )}

        {/* ConfigMap fields */}
        {isConfigMap && (
          <div className="mb-4">
            <label className="block font-medium mb-1">Data (key-value pairs)</label>
            <KeyValueList 
              entries={Object.entries(dataFields).map(([k,v]) => ({ key: k, value: v }))}
              onChange={(entries) => {
                const newData: Record<string, string> = {};
                entries.forEach(({ key, value }) => { if (key) newData[key] = value; });
                setDataFields(newData);
              }}
              keyPlaceholder="config key"
              valuePlaceholder="config value"
              valueAsTextarea={true}
            />
            <small className="text-gray-500">You can add multi-line config values; they will appear as block literals in YAML.</small>
          </div>
        )}

        {/* Secret fields */}
        {isSecret && (
          <div className="mb-4">
            <div className="mb-2">
              <label className="block font-medium mb-1">Secret Type</label>
              <input 
                type="text" 
                className="w-full border rounded px-2 py-1"
                value={secretType}
                onChange={(e) => setSecretType(e.target.value)}
                placeholder="e.g. Opaque (default), kubernetes.io/tls, etc."
              />
            </div>
            <label className="block font-medium mb-1">Data (key-value pairs)</label>
            <KeyValueList 
              entries={Object.entries(dataFields).map(([k,v]) => ({ key: k, value: v }))}
              onChange={(entries) => {
                const newData: Record<string, string> = {};
                entries.forEach(({ key, value }) => { if (key) newData[key] = value; });
                setDataFields(newData);
              }}
              keyPlaceholder="secret key"
              valuePlaceholder="secret value (plain text)"
            />
            <small className="text-gray-500">Secret values will be base64-encoded in the output.</small>
          </div>
        )}

        {/* PersistentVolumeClaim fields */}
        {isPVC && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium mb-1">Access Modes</label>
              <select 
                multiple
                className="w-full border rounded px-2 py-1"
                value={accessModes}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setAccessModes(selected);
                }}
              >
                {accessModeOptions.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Storage Request</label>
              <input 
                type="text" 
                className="w-full border rounded px-2 py-1"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="e.g. 10Gi"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Storage Class Name</label>
              <input 
                type="text" 
                className="w-full border rounded px-2 py-1"
                value={storageClassName}
                onChange={(e) => setStorageClassName(e.target.value)}
                placeholder="StorageClass for PVC"
              />
            </div>
          </div>
        )}

        {/* Ingress fields */}
        {isIngress && (
          <div className="mb-4">
            <div className="mb-2">
              <label className="block font-medium mb-1">Ingress Class Name</label>
              <input 
                type="text" 
                className="w-full border rounded px-2 py-1"
                value={ingressClassName}
                onChange={(e) => setIngressClassName(e.target.value)}
                placeholder="e.g. nginx"
              />
            </div>
            <div className="mb-2">
              <label className="block font-medium mb-1">TLS Configuration</label>
              <p className="text-sm text-gray-600">*For simplicity, please edit TLS and rules in YAML preview if needed.*</p>
            </div>
            <div>
              <label className="block font-medium mb-1">Rules</label>
              <p className="text-sm text-gray-600">*For simplicity, please edit Ingress rules in YAML preview if needed.*</p>
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={handleAdd}
        disabled={!apiVersion || !kind}
        className="mt-2 px-3 py-2 bg-green-600 text-white font-medium rounded disabled:bg-gray-400"
      >
        Add Resource
      </button>
    </div>
  );
}
