import { useState, useEffect, useCallback } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { useAuth } from '@clerk/clerk-react';
import { Github, X, Folder, File, ChevronRight, ChevronDown, Link, Loader2, Download, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { codeToHtml } from 'shiki';

interface GitHubFileItem {
  name: string;
  type: 'file' | 'dir';
  path: string;
  download_url?: string;
  url?: string;
  children?: GitHubFileItem[];
}

interface RepoImporterProps {
  onClose?: () => void;
  embedded?: boolean;
}

// Map file extensions to Shiki language identifiers
const getLanguageFromPath = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    rs: 'rust',
    go: 'go',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    mdx: 'mdx',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    sql: 'sql',
    graphql: 'graphql',
    gql: 'graphql',
    xml: 'xml',
    toml: 'toml',
    dockerfile: 'dockerfile',
    vue: 'vue',
    svelte: 'svelte',
    prisma: 'prisma',
    r: 'r',
    lua: 'lua',
    dart: 'dart',
  };
  return languageMap[ext] ?? 'plaintext';
};

const highlightCode = async (code: string, filePath: string): Promise<string> => {
  const lang = getLanguageFromPath(filePath);
  try {
    return await codeToHtml(code, {
      lang,
      theme: 'github-dark',
    });
  } catch {
    // Fallback to plaintext if the language isn't supported
    return await codeToHtml(code, {
      lang: 'plaintext',
      theme: 'github-dark',
    });
  }
};

// Binary file detection helpers
const isImageFile = (filePath: string): boolean => {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif'].includes(ext);
};

const isBinaryFile = (filePath: string): boolean => {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const binaryExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif',
    'pdf', 'zip', 'tar', 'gz', '7z', 'rar',
    'exe', 'dll', 'so', 'dylib', 'bin', 'iso',
    'wasm', 'woff', 'woff2', 'ttf', 'eot', 'otf',
    'mp3', 'wav', 'ogg', 'mp4', 'mov', 'webm', 'mkv',
    'db', 'sqlite', 'sqlite3', 'class', 'pyc', 'lockb'
  ];
  return binaryExtensions.includes(ext);
};

// Shared file viewer used in both host and non-host panels
const FileViewer = ({
  selectedFilePath,
  selectedFileUrl,
  fileViewMode,
  highlightedHtml,
  isFileLoading,
}: {
  selectedFilePath: string | null;
  selectedFileUrl: string | null;
  fileViewMode: 'code' | 'image' | 'binary';
  highlightedHtml: string | null;
  isFileLoading: boolean;
}) => {
  if (!selectedFilePath) return null;

  return (
    <div className="mt-3 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-300 truncate">
          {selectedFilePath}
        </span>
        {selectedFileUrl && (
          <a
            href={selectedFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0 ml-2"
          >
            <Download className="w-3 h-3" />
            <span>Raw</span>
          </a>
        )}
      </div>
      <div className="flex-1 overflow-auto rounded-xl bg-[#08121f] border border-[rgba(0,180,255,0.14)] p-3 text-xs font-mono no-scrollbar">
        {isFileLoading ? (
          <div className="flex items-center gap-2 text-cyan-300 p-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading file…</span>
          </div>
        ) : fileViewMode === 'image' && selectedFileUrl ? (
          <div className="flex flex-col items-center justify-center p-4 min-h-[180px]">
            <img
              src={selectedFileUrl}
              alt={selectedFilePath}
              className="max-h-60 max-w-full rounded-lg object-contain shadow-md border border-cyan-500/20 bg-black/40"
            />
            <p className="mt-2 text-[11px] text-neutral-400 font-sans">
              Image preview · {selectedFilePath.split('.').pop()?.toUpperCase()}
            </p>
          </div>
        ) : fileViewMode === 'binary' && selectedFileUrl ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center font-sans">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <FileCode className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">{selectedFilePath.split('/').pop()}</p>
            <p className="text-xs text-neutral-400 max-w-[240px] mb-4">
              Binary or non-text asset cannot be highlighted in code viewer.
            </p>
            <a
              href={selectedFileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>
          </div>
        ) : highlightedHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            className="shiki-wrapper [&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:!p-0 [&>pre]:overflow-visible"
          />
        ) : (
          <span className="text-neutral-400">No content</span>
        )}
      </div>
    </div>
  );
};

const GithubRepoImporter = ({ onClose, embedded = false }: RepoImporterProps) => {
  const { userId, getToken } = useAuth();
  const call = useCall();
  const { toast } = useToast();
  const beurl = import.meta.env.VITE_BE_URL;
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [fileTree, setFileTree] = useState<GitHubFileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [fileViewMode, setFileViewMode] = useState<'code' | 'image' | 'binary'>('code');
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);

  const isHost = call?.state.createdBy?.id === userId;

  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (match) return { owner: match[1], repo: match[2] };
    return null;
  };

  const fetchRepoContents = useCallback(
    async (
      owner: string,
      repo: string,
      path: string = ''
    ): Promise<GitHubFileItem[]> => {
      const token = await getToken();
      const url = `${beurl}/api/github/repo/${owner}/${repo}/contents${path ? '/' + path : ''}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || errorData.message || 'Failed to fetch repository contents');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          name: item.name,
          type: item.type,
          path: item.path,
          download_url: item.download_url,
          url: item.url,
        }));
      }
      return [];
    },
    [beurl, getToken]
  );

  const fetchRepoInfo = useCallback(
    async (owner: string, repo: string) => {
      const token = await getToken();
      const response = await fetch(`${beurl}/api/github/repo/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || errorData.message || 'Failed to fetch repository information');
      }
      return response.json();
    },
    [beurl, getToken]
  );

  // Sync lightweight repo pointer across participants and lazily load contents
  useEffect(() => {
    const imported = call?.state.custom?.importedRepo;
    if (!imported) return;

    const targetFullName = imported.fullName || imported.info?.full_name;
    const targetDesc = imported.description || imported.info?.description || '';
    const targetBranch = imported.defaultBranch || imported.info?.default_branch || 'main';
    const targetOwner = imported.owner || (targetFullName ? targetFullName.split('/')[0] : '');
    const targetRepo = imported.repo || (targetFullName ? targetFullName.split('/')[1] : '');

    if (!targetFullName) return;

    setRepoInfo((prev: any) => {
      if (prev?.full_name === targetFullName) return prev;
      return {
        full_name: targetFullName,
        description: targetDesc,
        default_branch: targetBranch,
      };
    });

    if (imported.fileTree && Array.isArray(imported.fileTree) && imported.fileTree.length > 0) {
      setFileTree(imported.fileTree);
    } else if (targetOwner && targetRepo && (!repoInfo || repoInfo.full_name !== targetFullName)) {
      setIsLoading(true);
      fetchRepoContents(targetOwner, targetRepo)
        .then((contents) => {
          setFileTree(contents);
        })
        .catch((err) => {
          console.error('Failed to lazily load repo contents:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [call?.state.custom?.importedRepo, fetchRepoContents, repoInfo]);

  const handleImportRepo = async () => {
    if (!repoUrl.trim()) return;
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      toast({ title: 'Invalid GitHub URL', description: 'Please enter a valid GitHub repository URL', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const [info, contents] = await Promise.all([
        fetchRepoInfo(parsed.owner, parsed.repo),
        fetchRepoContents(parsed.owner, parsed.repo),
      ]);
      setRepoInfo(info);
      setFileTree(contents);

      // Store lightweight pointer in call custom data to prevent quota overflow
      await call?.update({
        custom: {
          ...call?.state.custom,
          importedRepo: {
            owner: parsed.owner,
            repo: parsed.repo,
            fullName: info.full_name,
            description: info.description || '',
            defaultBranch: info.default_branch || 'main',
            importedBy: userId,
            importedAt: new Date().toISOString(),
          },
        },
      });
      toast({ title: 'Repository imported successfully', description: `${info.full_name} is now available to all participants` });
    } catch (error: any) {
      toast({ title: 'Failed to import repository', description: error?.message || 'Failed to import repository. Please check the URL and try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const loadFolderChildren = async (item: GitHubFileItem) => {
    if (!repoInfo || item.type !== 'dir') return;
    if (item.children && item.children.length > 0) return;
    try {
      const [owner, repo] = repoInfo.full_name.split('/');
      const children = await fetchRepoContents(owner, repo, item.path);
      const updateTree = (nodes: GitHubFileItem[]): GitHubFileItem[] =>
        nodes.map((node) => {
          if (node.path === item.path) return { ...node, children };
          if (node.type === 'dir' && node.children) return { ...node, children: updateTree(node.children) };
          return node;
        });
      setFileTree((prev) => updateTree(prev));
    } catch {
      toast({ title: 'Failed to load folder', description: 'Could not load folder contents', variant: 'destructive' });
    }
  };

  const handleFileClick = useCallback(async (item: GitHubFileItem) => {
    if (!item.download_url) return;
    try {
      setIsFileLoading(true);
      setSelectedFilePath(item.path);
      setSelectedFileUrl(item.download_url);
      setHighlightedHtml(null);

      if (isImageFile(item.path)) {
        setFileViewMode('image');
        return;
      }

      if (isBinaryFile(item.path)) {
        setFileViewMode('binary');
        return;
      }

      setFileViewMode('code');

      const response = await fetch(item.download_url);
      if (!response.ok) throw new Error('Failed to fetch file content');
      const text = await response.text();

      // Guard against gigantic files (>500KB) locking up the browser
      if (text.length > 500000) {
        const truncated = text.substring(0, 500000) + '\n\n// --- File truncated for performance (exceeds 500KB) ---';
        const html = await highlightCode(truncated, item.path);
        setHighlightedHtml(html);
      } else {
        const html = await highlightCode(text, item.path);
        setHighlightedHtml(html);
      }
    } catch (error: any) {
      toast({ title: 'Failed to load file', description: error.message || 'Unable to load file content', variant: 'destructive' });
    } finally {
      setIsFileLoading(false);
    }
  }, [toast]);

  const renderFileTree = (items: GitHubFileItem[], level: number = 0) =>
    items
      .filter((item) => !item.name.startsWith('.'))
      .sort((a, b) => {
        if (a.type === 'dir' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      })
      .map((item) => (
        <div key={item.path} style={{ marginLeft: `${level * 14}px` }}>
          <div
            className={`flex items-center gap-1.5 py-1 px-2 hover:bg-white/[0.06] rounded-lg cursor-pointer transition-colors text-xs ${
              selectedFilePath === item.path ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-neutral-300'
            }`}
            onClick={() =>
              item.type === 'dir'
                ? (toggleFolder(item.path), loadFolderChildren(item))
                : handleFileClick(item)
            }
          >
            {item.type === 'dir' ? (
              expandedFolders.has(item.path) ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
              )
            ) : (
              <div className="w-3.5 h-3.5 shrink-0" />
            )}
            {item.type === 'dir' ? (
              <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            ) : (
              <File className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            )}
            <span className="truncate">{item.name}</span>
            {item.type === 'file' && item.download_url && (
              <Link className="w-3 h-3 text-neutral-500 ml-auto shrink-0" />
            )}
          </div>
          {item.type === 'dir' && expandedFolders.has(item.path) && (
            <div>
              {item.children && item.children.length > 0 ? (
                renderFileTree(item.children, level + 1)
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-neutral-400 ml-5 py-1">
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                  Loading…
                </div>
              )}
            </div>
          )}
        </div>
      ));

  const repoDetails = repoInfo && (
    <div className="p-3 mb-2 rounded-xl bg-white/[0.03] border border-[rgba(0,180,255,0.15)] space-y-1">
      <div className="flex items-center gap-2">
        <Github className="w-4 h-4 text-cyan-400 shrink-0" />
        <h3 className="font-semibold text-xs text-white truncate">{repoInfo.full_name}</h3>
      </div>
      {repoInfo.description && (
        <p className="text-[11px] text-neutral-400 line-clamp-2">{repoInfo.description}</p>
      )}
    </div>
  );

  const filePanel = repoInfo ? (
    <div className="flex-1 flex flex-col min-h-0">
      {repoDetails}
      <h4 className="font-medium text-xs text-neutral-300 mb-1.5 px-1">Files</h4>
      <div className="overflow-y-auto rounded-xl border border-[rgba(0,180,255,0.14)] bg-[#051120]/70 max-h-56 p-2 no-scrollbar">
        {renderFileTree(fileTree)}
      </div>
      <FileViewer
        selectedFilePath={selectedFilePath}
        selectedFileUrl={selectedFileUrl}
        fileViewMode={fileViewMode}
        highlightedHtml={highlightedHtml}
        isFileLoading={isFileLoading}
      />
    </div>
  ) : null;

  // Embedded dock rendering
  if (embedded) {
    return (
      <div className="flex flex-col h-full w-full min-h-0 bg-transparent overflow-hidden">
        {/* If host, allow importing or switching repo */}
        {isHost && (
          <div className="p-3 border-b border-[rgba(0,180,255,0.12)] bg-[#020b16]/60">
            <div className="flex gap-2 items-center">
              <Input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="flex-1 h-9 text-xs rounded-xl bg-[#061527]/90 border-[rgba(0,180,255,0.2)] text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-cyan-400"
                onKeyDown={(e) => e.key === 'Enter' && handleImportRepo()}
              />
              <Button
                onClick={handleImportRepo}
                disabled={!repoUrl.trim() || isLoading}
                className="h-9 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-40 shadow-[0_0_12px_rgba(0,180,255,0.25)] text-xs flex-shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 flex flex-col min-h-0 no-scrollbar">
          {filePanel ?? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-neutral-400">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
                <Github className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-sm font-medium text-white mb-1">
                {isHost ? "Import a GitHub Repository" : "No Repository Active"}
              </p>
              <p className="text-xs text-neutral-400 max-w-[220px]">
                {isHost
                  ? "Enter a public GitHub repository URL above to share code with students."
                  : "The host has not imported a repository yet. Code will appear here once shared."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standalone mode fallback
  if (!isHost) {
    return (
      <div className="flex flex-col h-[calc(100vh-86px)] w-[400px] bg-light-1 dark:bg-dark-1 border-l border-light-4 dark:border-dark-4">
        <div className="flex items-center justify-between p-4 border-b border-light-4 dark:border-dark-4">
          <h2 className="text-lg font-semibold text-dark-2 dark:text-white">Repository</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col min-h-0">
          {filePanel ?? (
            <div className="flex items-center justify-center h-full text-dark-2/60 dark:text-white/60">
              <p className="text-sm">No repository imported yet</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-86px)] w-[400px] bg-light-1 dark:bg-dark-1 border-l border-light-4 dark:border-dark-4">
      <div className="flex items-center justify-between p-4 border-b border-light-4 dark:border-dark-4">
        <h2 className="text-lg font-semibold text-dark-2 dark:text-white">Import Repository</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-4 border-b border-light-4 dark:border-dark-4">
        <div className="flex gap-2">
          <Input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleImportRepo()}
          />
          <Button
            onClick={handleImportRepo}
            disabled={!repoUrl.trim() || isLoading}
            className="bg-royal-1 hover:bg-royal-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
        {filePanel ?? (
          <div className="flex items-center justify-center h-full text-dark-2/60 dark:text-white/60">
            <p className="text-sm">Enter a GitHub repository URL to import</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GithubRepoImporter;
