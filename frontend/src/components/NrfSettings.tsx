import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  ConnectionMode,
  MarkerType,
  Handle,
  Position,
  EdgeProps,
  getRectOfNodes,
  getTransformForBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut, Upload, Search, FileText, Plus, RefreshCw, Loader2, Zap, Power, PowerOff, BatteryLow, ArrowLeftIcon, Download } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { resetUser } from '../store/slices/userSlice';
import { authApi, jsonApis } from '../api';
import { User } from '../types';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

const CustomNode = ({
  data,
}: {
  data: {
    label: string;
    icon?: React.ReactNode;
    conditions?: {
      and: string[];      
      or: string[];       
      nonZero: string[];
      targ: string[];
    };
    handlesUsed?: string[];
  };
}) => {
  const isState = !data.conditions;
  const used = new Set(data.handlesUsed ?? []);
  
  const andConditions = data.conditions?.and || []; 
  const orConditions = data.conditions?.or || [];  
  const nonZeroConditions = data.conditions?.nonZero || []; 
  const targetConditions = data.conditions?.targ || [];

  const formatConditions = (conditions: string[], separator: string, color: string,targetConditions: string[]) => {
    return (
      <span>
        {conditions.map((condition, index) => {
          const isTarget = targetConditions.includes(condition);
          const suffix = isTarget ? ' : 1' : ' : 0';
          return (
            <span key={index}>
              {condition}{suffix}
              {index < conditions.length - 1 && (
                <span className={`text-${color}-600`}>{` ${separator} `}</span>
              )}
            </span>
          );
        })}
      </span>
    );
  };

  const renderConditions = (andConditions: string[], orConditions: string[], nonZeroConditions: string[], targetConditions: string[]) => {
    if (andConditions.length > 0 && orConditions.length > 0) {
      return (
        <p className="text-gray-700 break-words">
          {formatConditions(andConditions, 'and', 'blue', targetConditions)}
          {' and {'}
          {formatConditions(orConditions, 'or', 'red', targetConditions)}
          {'}'}
        </p>
      );
    } else if (orConditions.length > 0) {
      return (
        <p className="text-gray-700 break-words">
          {formatConditions(orConditions, 'or', 'red', targetConditions)}
        </p>
      );
    } else if (andConditions.length > 0) {
      return (
        <p className="text-gray-700 break-words">
          {formatConditions(andConditions, 'and', 'blue', targetConditions)}
        </p>
      );
    } else {
      return <p className="text-gray-700 break-words">NONE</p>;
    }
  };

  return (
    <div 
      className={`shadow-lg rounded-lg ${
        isState 
          ? 'px-8 py-4 w-[18rem]'
          : 'p-4 w-fit min-w-[18rem]'
      }`}
      style={{
        background: isState 
          ? 'linear-gradient(to right, #6366f1, #a855f7)' 
          : '#ffffff',
        border: isState ? 'none' : '1px solid #d1d5db'
      }}
    >
      {isState ? (
        <>
          {/* Standard left/right handles at 30% and 70% positions */}
          {used.has('target-left') && (
            <Handle
              id="target-left"
              type="target"
              position={Position.Left}
              style={{ background: '#6366f1', width: 8, height: 8, top: '30%' }}
            />
          )}
          {used.has('target-right') && (
            <Handle
              type="target"
              position={Position.Right}
              id="target-right"
              style={{ background: '#6366f1', width: 8, height: 8, top: '30%' }}
            />
          )}
          {used.has('source-left') && (
            <Handle
              id="source-left"
              type="source"
              position={Position.Left}
              style={{ background: '#6366f1', width: 8, height: 8, top: '70%' }}
            />
          )}
          {used.has('source-right') && (
            <Handle
              id="source-right"
              type="source"
              position={Position.Right}
              style={{ background: '#6366f1', width: 8, height: 8, top: '70%' }}
            />
          )}
          
          {/* Additional handles for complex routing */}
          {used.has('source-left-top') && (
            <Handle
              id="source-left-top"
              type="source"
              position={Position.Left}
              style={{ background: '#6366f1', width: 8, height: 8, top: '30%' }}
            />
          )}
          {used.has('source-right-top') && (
            <Handle
              id="source-right-top"
              type="source"
              position={Position.Right}
              style={{ background: '#6366f1', width: 8, height: 8, top: '30%' }}
            />
          )}
          {used.has('source-left-bottom') && (
            <Handle
              id="source-left-bottom"
              type="source"
              position={Position.Left}
              style={{ background: '#6366f1', width: 8, height: 8, top: '70%' }}
            />
          )}
          {used.has('source-right-bottom') && (
            <Handle
              id="source-right-bottom"
              type="source"
              position={Position.Right}
              style={{ background: '#6366f1', width: 8, height: 8, top: '70%' }}
            />
          )}
          
          {/* Target handles for bottom connections */}
          {used.has('target-left-bottom') && (
            <Handle
              id="target-left-bottom"
              type="target"
              position={Position.Left}
              style={{ background: '#6366f1', width: 8, height: 8, top: '70%' }}
            />
          )}
          {used.has('target-right-bottom') && (
            <Handle
              id="target-right-bottom"
              type="target"
              position={Position.Right}
              style={{ background: '#6366f1', width: 8, height: 8, top: '70%' }}
            />
          )}
          
          {/* Target handles for top connections */}
          {used.has('target-left-top') && (
            <Handle
              id="target-left-top"
              type="target"
              position={Position.Left}
              style={{ background: '#6366f1', width: 8, height: 8, top: '30%' }}
            />
          )}
          {used.has('target-right-top') && (
            <Handle
              id="target-right-top"
              type="target"
              position={Position.Right}
              style={{ background: '#6366f1', width: 8, height: 8, top: '30%' }}
            />
          )}
          
          <div className="flex items-center gap-3 justify-center">
            {data.icon}
            <div className="font-bold text-lg text-white">{data.label}</div>
          </div>
        </>
      ) : (
        <>
          {/* Condition node handles */}
          {used.has('target-left') && (
            <Handle
              id="target-left"
              type="target"
              position={Position.Left}
              style={{ background: '#6366f1', width: 8, height: 8 }}
            />
          )}
          {used.has('target-right') && (
            <Handle
              id="target-right"
              type="target"
              position={Position.Right}
              style={{ background: '#6366f1', width: 8, height: 8 }}
            />
          )}
          {used.has('source-top') && (
            <Handle
              id="source-top"
              type="source"
              position={Position.Top}
              style={{ background: '#6366f1', width: 8, height: 8 }}
            />
          )}
          {used.has('source-left') && (
            <Handle
              id="source-left"
              type="source"
              position={Position.Left}
              style={{ background: '#6366f1', width: 8, height: 8 }}
            />
          )}
          {used.has('source-right') && (
            <Handle
              id="source-right"
              type="source"
              position={Position.Right}
              style={{ background: '#6366f1', width: 8, height: 8 }}
            />
          )}
          
          <div className="text-sm text-gray-600">
            {renderConditions(andConditions, orConditions, nonZeroConditions, targetConditions)}
            {nonZeroConditions.length > 0 && (
              <div className="text-gray-700 break-words">
                {nonZeroConditions.map((condition, index) => (
                  <p key={index}>{condition}</p>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const FannedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  data,
}: EdgeProps) => {
  const offset = (data?.edgeOffset as number) ?? 0;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY =  dx / len;

  const controlX = midX + perpX * offset;
  const controlY = midY + perpY * offset;

  const d = `M${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`;

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={d}
      markerEnd={markerEnd}
      fill="none"
    />
  );
};

const EDGE_GAP      = 30;
const MULTI_EDGE_ID = 'multi';

const edgeTypes = { [MULTI_EDGE_ID]: FannedEdge };

const EDGE_COLOR = '#6366f1';

const edgeStyle: React.CSSProperties = {
  stroke: EDGE_COLOR,
  strokeWidth: 2,
};

const arrowMarker = {
  type : MarkerType.ArrowClosed,
  width: 12,
  height: 12,
  color: EDGE_COLOR,
};

const finalConditions = (conditionsListOne: string[], conditionsListTwo: string[]) => {
  const finalConditions: Record<string, string> = {};

  const processConditions = (conditions: string[]) => {
    return conditions.map(condition => {
      const key = condition.split(':')[0].trim();
      return { key, condition };
    });
  };

  const processedListOne = processConditions(conditionsListOne);
  const processedListTwo = processConditions(conditionsListTwo);

  const combinedList = [...processedListOne, ...processedListTwo];

  combinedList.forEach(item => {
    const { key, condition } = item;
    if (finalConditions[key]) {
      if (condition.length > finalConditions[key].length) {
        finalConditions[key] = condition;
      }
    } else {
      finalConditions[key] = condition;
    }
  });

  return Object.keys(finalConditions).length === 0 ? ["NONE"] : Object.values(finalConditions);
};

const createNodesAndEdges = (data: any, sleepcdns: any) => {
  const centerX      = 400;
  const STATE_W      = 288;

  const stateX       = centerX - STATE_W / 2;

  const H_GAP  = 200;

  const leftX  = stateX - H_GAP - STATE_W;
  const rightX = stateX + STATE_W + H_GAP;

  const nodes: Node[] = [
    {
      id: 'active',
      type: 'custom',
      position: { x: stateX, y: 50 },
      data: { 
        label: 'ACTIVE',
        icon: <Zap className="w-6 h-6 text-yellow-300" />
      }
    },
    {
      id: 'inactive',
      type: 'custom',
      position: { x: stateX, y: 280 },
      data: { 
        label: 'INACTIVE',
        icon: <Power className="w-6 h-6 text-gray-200" />
      }
    },
    {
      id: 'sleep',
      type: 'custom',
      position: { x: stateX, y: 450 },
      data: { 
        label: 'SLEEP',
        icon: <PowerOff className="w-6 h-6 text-blue-300" />
      }
    },
    {
      id: 'deep-sleep',
      type: 'custom',
      position: { x: stateX, y: 650 },
      data: { 
        label: 'DEEP SLEEP',
        icon: <BatteryLow className="w-6 h-6 text-green-300" />
      }
    },
    {
      id: 'condition-inact-to-act',
      type: 'custom',
      position: { x: leftX, y: 150 },
      data: { 
        conditions: {
          and: getAndConditions(sleepcdns.inactToAct),
          or: getOrConditions(sleepcdns.inactToAct),
          targ: getTargetConditions(sleepcdns.inactToAct),
          nonZero: getNonZeroConditions(data.inactToAct),
        }
      }
    },
    {
      id: 'condition-sleep-to-inact',
      type: 'custom',
      position: { x: leftX, y: 350 },
      data: { 
        conditions: {
          and: getAndConditions(sleepcdns.sleepToInact),
          or: getOrConditions(sleepcdns.sleepToInact),
          targ: getTargetConditions(sleepcdns.sleepToInact),
          nonZero: getNonZeroConditions(data.sleepToInact),
        }
      }
    },
    {
      id: 'condition-deep-to-inact',
      type: 'custom',
      position: { x: leftX, y: 550 },
      data: { 
        conditions: {
          and: getAndConditions(sleepcdns.deepSleepToInact),
          or: getOrConditions(sleepcdns.deepSleepToInact),
          targ: getTargetConditions(sleepcdns.deepSleepToInact),
          nonZero: getNonZeroConditions(data.deepSleepToInact),
        }
      }
    },
    {
      id: 'condition-act-to-inact',
      type: 'custom',
      position: { x: rightX, y: 150 },
      data: { 
        conditions: {
          and: getAndConditions(sleepcdns.actToInact),
          or: getOrConditions(sleepcdns.actToInact),
          targ: getTargetConditions(sleepcdns.actToInact),
          nonZero: getNonZeroConditions(data.actToInact),
        }
      }
    },
    {
      id: 'condition-inact-to-sleep',
      type: 'custom',
      position: { x: rightX, y: 350 },
      data: { 
        conditions: {
          and: getAndConditions(sleepcdns.inactToSleep),
          or: getOrConditions(sleepcdns.inactToSleep),
          targ: getTargetConditions(sleepcdns.inactToSleep),
          nonZero: getNonZeroConditions(data.inactToSleep),
        }
      }
    },
    {
      id: 'condition-sleep-to-deep',
      type: 'custom',
      position: { x: rightX, y: 550 },
      data: { 
        conditions: {
          and: getAndConditions(sleepcdns.sleepToDeepSleep),
          or: getOrConditions(sleepcdns.sleepToDeepSleep),
          targ: getTargetConditions(sleepcdns.sleepToDeepSleep),
          nonZero: getNonZeroConditions(data.sleepToDeepSleep),
        }
      }
    }
  ];

  const edges: Edge[] = [
    {
      id: 'active-to-condition1',
      source: 'active',
      target: 'condition-act-to-inact',
      sourceHandle: 'source-right',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'condition1-to-inactive',
      source: 'condition-act-to-inact',
      target: 'inactive',
      targetHandle: 'target-right',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'inactive-to-condition2',
      source: 'inactive',
      target: 'condition-inact-to-act',
      sourceHandle: 'source-left',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'condition2-to-active',
      source: 'condition-inact-to-act',
      target: 'active',
      targetHandle: 'target-left',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'inactive-to-condition3',
      source: 'inactive',
      target: 'condition-inact-to-sleep',
      sourceHandle: 'source-right',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'condition3-to-sleep',
      source: 'condition-inact-to-sleep',
      target: 'sleep',
      targetHandle: 'target-right',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'sleep-to-condition4',
      source: 'sleep',
      target: 'condition-sleep-to-inact',
      sourceHandle: 'source-left',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'condition4-to-inactive',
      source: 'condition-sleep-to-inact',
      target: 'inactive',
      targetHandle: 'target-left-bottom',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'sleep-to-condition5',
      source: 'sleep',
      target: 'condition-sleep-to-deep',
      sourceHandle: 'source-right',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'condition5-to-deep-sleep',
      source: 'condition-sleep-to-deep',
      target: 'deep-sleep',
      targetHandle: 'target-right',
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      markerEnd: arrowMarker,
    },
    {
      id: 'deep-sleep-to-condition6',
      source: 'deep-sleep',
      target: 'condition-deep-to-inact',
      sourceHandle: 'source-left',
      type: 'smoothstep',
      animated: true,
      style: {
        ...edgeStyle,
        strokeDasharray: '5,5'
      },
      markerEnd: arrowMarker,
    },
    {
      id: 'condition6-to-inactive',
      source: 'condition-deep-to-inact',
      target: 'inactive',
      targetHandle: 'target-left-bottom',
      type: 'smoothstep',
      animated: true,
      style: {
        ...edgeStyle,
        strokeDasharray: '5,5'
      },
      markerEnd: arrowMarker,
    }
  ];

  const handleUsage: Record<string, Set<string>> = {};

  edges.forEach(e => {
    const sourceNode = nodes.find(n => n.id === e.source)!;
    const targetNode = nodes.find(n => n.id === e.target)!;
    const isDown = sourceNode.position.y < targetNode.position.y;
    const isUp   = sourceNode.position.y > targetNode.position.y;

    const srcCond  = Boolean((sourceNode.data as any)?.conditions);
    const tgtState = !Boolean((targetNode.data as any)?.conditions);
    const srcState = !srcCond;
    const tgtCond  = !tgtState;

    if (!e.sourceHandle) {
      e.sourceHandle =
        isDown
          ? sourceNode.position.x < targetNode.position.x
            ? 'source-right'
            : 'source-left'
          : sourceNode.position.x < targetNode.position.x
            ? 'source-right'
            : 'source-left';
    }

    if (!e.targetHandle) {
      e.targetHandle =
        isDown
          ? targetNode.position.x < sourceNode.position.x
            ? 'target-left'
            : 'target-right'
          : targetNode.position.x < sourceNode.position.x
            ? 'target-left'
            : 'target-right';
    }

    const goesLeft = sourceNode.position.x > targetNode.position.x;
    const goesRight = sourceNode.position.x < targetNode.position.x;

    if (srcState && tgtCond && goesLeft) {
      e.targetHandle = 'target-right';
    }

    if (srcCond && tgtState && goesRight) {
      e.sourceHandle = 'source-left';
    }

    if (isUp) {
      if (srcState) {
        e.sourceHandle =
          sourceNode.position.x < targetNode.position.x
            ? 'source-right-top'
            : 'source-left-top';
      }

      if (tgtState) {
        e.targetHandle =
          targetNode.position.x < sourceNode.position.x
            ? 'target-right-bottom'
            : 'target-left-bottom';
      }

      if (!e.type) e.type = 'smoothstep';   
    }

    (handleUsage[e.source] ??= new Set()).add(e.sourceHandle);
    (handleUsage[e.target] ??= new Set()).add(e.targetHandle);
  });

  const stateNodeIds = ['active', 'inactive', 'sleep', 'deep-sleep'];
  const leftHandles = ['target-left', 'target-left-bottom', 'target-left-top'];
  stateNodeIds.forEach(id => {
    if (!handleUsage[id]) handleUsage[id] = new Set();
    leftHandles.forEach(h => handleUsage[id].add(h));
  });

  const nodesWithHandles = nodes.map(n => ({
    ...n,
    data: { ...n.data, handlesUsed: Array.from(handleUsage[n.id] ?? []) },
  }));

  return { nodes: nodesWithHandles, edges };
};



const getAndConditions = (item: any) => {
  const conditions: string[] = [];
  if (item.cdn_and && Array.isArray(item.cdn_and)) {
    conditions.push(...item.cdn_and); 
  }
  return conditions; 
}

const getOrConditions = (item: any) => {
  const conditions: string[] = [];
  if (item.cdn_or && Array.isArray(item.cdn_or)) {
    conditions.push(...item.cdn_or); 
  }
  return conditions; 
}

const getTargetConditions = (item:any)=> {
  const conditions : string[] = [];
  if (item.cdn_targ && Array.isArray(item.cdn_targ)) {
    conditions.push(...item.cdn_targ); 
  }
  return conditions; 
}

const getNonZeroConditions = (settings: any) => {
  const conditions: string[] = [];
  const allowedKeys = ["ain0_v", "ain1_v", "vbat_v", "vin_v", "hysteresis", "mov_timeout", "state_timeout"];
  
  Object.entries(settings).forEach(([key, value]) => {
    if (value !== 0 && allowedKeys.includes(key)) {
      let label = key;
      let displayValue = value;

      switch(key) {
        case 'hysteresis':
          label = 'Hysteresis';
          displayValue = formatTime(Number(value)); 
          break;
        case 'mov_timeout':
          label = 'Movement Timeout';
          displayValue = formatTime(Number(value)); 
          break;
        case 'state_timeout':
          label = 'State Timeout';
          displayValue = formatTime(Number(value)); 
          break;
        case 'vbat_v':
          label = 'Vehicle Battery';
          displayValue = `${Number(value) / 10000} V`; 
          break;
        case 'vin_v':
          label = 'Voltage';
          displayValue = `${Number(value) / 10000} V`; 
          break;
        case 'ain0_v':
          label = 'Analog Input 0';
          displayValue = `${Number(value) / 10000} V`; 
          break;
        case 'ain1_v':
          label = 'Analog Input 1';
          displayValue = `${Number(value) / 10000} V`; 
          break;
        default:
          label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
      conditions.push(`${label}: ${displayValue}`);
    }
  });
  
  return conditions;
};

const formatTime = (value: number) => {
  const seconds = value / 1000; 
  if (seconds >= 3600) { 
    const hours = (seconds / 3600).toFixed(2);
    return hours.endsWith('.00') ? `${parseInt(hours)}hrs` : `${hours} hrs`;
  } else if (seconds >= 60) { 
    const minutes = (seconds / 60).toFixed(2);
    return minutes.endsWith('.00') ? `${parseInt(minutes)}m` : `${minutes} m`;
  } else { 
    const formattedSeconds = seconds.toFixed(2);
    return formattedSeconds.endsWith('.00') ? `${parseInt(formattedSeconds)}s` : `${formattedSeconds}s`;
  }
}

function NrfSettings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [records, setRecords] = useState<string[]>([]);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: { user: User }) => state.user);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const fetchedRecords = await jsonApis.getAllNrfSettings();
      
      const sortedRecords = fetchedRecords.sort((a, b) => {
        return a.localeCompare(b);
      });

      setRecords(sortedRecords);
    } catch (error) {
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = (e.target?.result as string).replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        const json = JSON.parse(content);
        if (!json.sleepsettings) {
          throw new Error('No sleep settings found in JSON');
        }
        const { nodes: newNodes, edges: newEdges } = createNodesAndEdges(json.sleepsettings, json.sleepcdns);
        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        toast.error('Invalid JSON file or missing sleep settings');
        console.error('JSON parse error:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleRecordSelect = async (name: string) => {
    setLoading(true);
    try {
      const details = await jsonApis.getNrfSettingsDetails(name);
      if (!details.sleepsettings) {
        throw new Error('No sleep settings found in JSON');
      }
      setFileName(name);
      const { nodes: newNodes, edges: newEdges } = createNodesAndEdges(details.sleepsettings, details.sleepcdns);
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.log('error', error);
      toast.error('Failed to fetch record details or missing sleep settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authApi.signOut();
    dispatch(resetUser());
    navigate('/');
  };

  const filteredRecords = records.filter(record =>
    record.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadImage = (dataUrl: string) => {
    const a = document.createElement('a');
    a.setAttribute('download', `${fileName || 'sleep-settings-diagram'}.png`);
    a.setAttribute('href', dataUrl);
    a.click();
  };

  const exportAsImage = useCallback(() => {
    if (nodes.length === 0) {
      toast.error('No diagram to export');
      return;
    }

    const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowElement) {
      toast.error('Diagram not found for export');
      return;
    }

    const SAFE_PADDING = 40; 

    const originalBg = reactFlowElement.style.background;
    reactFlowElement.style.background = '#ffffff';

    const bgGrid   = reactFlowElement.querySelector('.react-flow__background') as HTMLElement | null;
    const controls = reactFlowElement.querySelector('.react-flow__controls') as HTMLElement | null;

    const bgGridDisplay   = bgGrid   ? bgGrid.style.display   : undefined;
    const controlsDisplay = controls ? controls.style.display : undefined;

    if (bgGrid)   bgGrid.style.display   = 'none';
    if (controls) controls.style.display = 'none';

    const renderer = reactFlowElement.querySelector('.react-flow__renderer') as HTMLElement | null;
    const rootRect = reactFlowElement.getBoundingClientRect();
    const rRect    = renderer ? renderer.getBoundingClientRect() : rootRect;

    const captureX = Math.max(rRect.left  - rootRect.left - SAFE_PADDING, 0);
    const captureY = Math.max(rRect.top   - rootRect.top  - SAFE_PADDING, 0);
    const captureW =  rRect.width  + SAFE_PADDING * 2;
    const captureH =  rRect.height + SAFE_PADDING * 2;

    reactFlowElement.style.overflow = 'visible';

    const captureOptions: any = {
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: 2,
      x: captureX,
      y: captureY,
      width:  captureW,
      height: captureH,
    };

    html2canvas(reactFlowElement, captureOptions)
      .then((canvas) => {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.setAttribute('download', `${fileName || 'sleep-settings-diagram'}.png`);
        a.setAttribute('href', dataUrl);
        a.click();

        toast.success('Diagram exported successfully as PNG!');

        reactFlowElement.style.background = originalBg;
        if (bgGrid && bgGridDisplay !== undefined)   bgGrid.style.display   = bgGridDisplay;
        if (controls && controlsDisplay !== undefined) controls.style.display = controlsDisplay;
      })
      .catch((error) => {
        console.error('Export failed:', error);
        toast.error('Failed to export diagram');

        reactFlowElement.style.background = originalBg;
        if (bgGrid && bgGridDisplay !== undefined)   bgGrid.style.display   = bgGridDisplay;
        if (controls && controlsDisplay !== undefined) controls.style.display = controlsDisplay;
      });
  }, [nodes, fileName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 bg-white/10 rounded-lg px-3 py-2"
            >
              <Home className="w-5 h-5" />
              Homepage
            </button>
            <h1 className="text-xl font-semibold text-white absolute left-1/2 transform -translate-x-1/2">
              SLEEP SETTINGS LOGIC
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar}
                  alt="User"
                  className="w-8 h-8 rounded-full border-2 border-white"
                  onError={(e) => {
                    e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/5987/5987424.png';
                  }}
                />
                <div className="text-white">
                  <p className="text-sm font-medium">{user?.email || ''}</p>
                  <p className="text-xs opacity-75 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {nodes.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="flex flex-col p-12 border-2 border-gray-300 rounded-xl bg-gray-50/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={fetchRecords}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    title="Refresh records"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-64 rounded-lg border border-gray-200">
                  {loading ? (
                    <div className="flex items-center justify-center h-full p-8">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                  ) : records.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredRecords.map((name, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecordSelect(name)}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-all"
                        >
                          <h3 className="font-medium text-gray-900">{name}</h3>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center p-8">Click refresh to load records</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 backdrop-blur-sm">
                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4 text-center">
                  Upload your JSON file to visualize the power states
                </p>
                <label className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg cursor-pointer transition-all transform hover:scale-105">
                  Choose JSON File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setFileName('');
                      setNodes([]);
                      setEdges([]);
                    }}
                    className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">{fileName}</span>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                    <Plus className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-600">Upload New File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  onClick={exportAsImage}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  title="Export diagram as PNG"
                >
                  <Download className="w-5 h-5" />
                  <span>Export PNG</span>
                </button>
              </div>
              <div style={{ height: '70vh'}}  className="bg-white rounded-lg border border-gray-200">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  connectionMode={ConnectionMode.Loose}
                  fitView

                  defaultEdgeOptions={{
                    style: { stroke: EDGE_COLOR, strokeWidth: 2 },
                    markerEnd: arrowMarker,
                  }}
                >
                  <Background />
                  <Controls />
                </ReactFlow>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NrfSettings;