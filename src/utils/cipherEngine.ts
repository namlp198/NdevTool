// Realistic code pools for Camouflage Input (Cipher Engine)
// As the user types natural language (Vietnamese / English), characters map deterministically
// to realistic systems code so anyone looking over the shoulder sees high-level systems programming.

const CODE_TEMPLATES: Record<'rust-kernel' | 'cpp-vulkan' | 'asm-hex', string[]> = {
  'rust-kernel': [
    `unsafe fn alloc_dma_page(phys_addr: usize, flags: PageFlags) -> Result<VirtAddr, KernelError> {\n    let frame = FRAME_ALLOCATOR.lock().alloc_contiguous(1, flags.bits())?;\n    mmu::map_kernel_range(frame.start_address(), PAGE_SIZE, ProtFlags::RW | ProtFlags::NO_CACHE)?;\n    Ok(VirtAddr::from_phys(frame.start_address()))\n}`,
    `impl SchedulerQueue for PerCpuRunQueue {\n    #[inline(always)]\n    fn pick_next_task(&mut self, curr: &TaskStruct) -> Option<Arc<TaskStruct>> {\n        self.vruntime_rb.first_entry().map(|node| node.task.clone())\n    }\n}`,
    `pub fn verify_ring_buffer_crc32(buf: &[u8], seed: u32) -> bool {\n    let mut crc = !seed;\n    for &byte in buf.iter() {\n        crc = (crc >> 8) ^ CRC32_TABLE[((crc ^ byte as u32) & 0xFF) as usize];\n    }\n    !crc == EXPECTED_RING_SIGNATURE\n}`,
  ],
  'cpp-vulkan': [
    `VkResult NdevPipeline::DispatchComputeFrame(VkCommandBuffer cmd, uint32_t groupCountX, uint32_t groupCountY) {\n    vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_COMPUTE, m_computePipeline);\n    vkCmdBindDescriptorSets(cmd, VK_PIPELINE_BIND_POINT_COMPUTE, m_pipelineLayout, 0, 1, &m_descriptorSet, 0, nullptr);\n    vkCmdDispatch(cmd, groupCountX, groupCountY, 1);\n    return VK_SUCCESS;\n}`,
    `void MemoryArena::CompactSparsePages(std::span<PageDescriptor> pages, uint64_t fenceValue) {\n    std::scoped_lock lock(m_arenaMutex);\n    for (auto& desc : pages) {\n        if ((desc.flags & PAGE_DIRTY_BIT) && desc.lastFence <= fenceValue) {\n            FlushMappedRange(desc.basePtr, desc.byteLength);\n        }\n    }\n}`,
  ],
  'asm-hex': [
    `0x00007FF8A410: 48 89 5C 24 08 48 89 74 24 10 57 48 83 EC 20  ; mov [rsp+8], rbx ; sub rsp, 20h\n0x00007FF8A420: 48 8B F9 48 8B F2 48 8D 0D 91 4B 02 00 E8 14  ; lea rcx, [rip+0x24b91] ; call sys_trace_enter\n0x00007FF8A430: 85 C0 0F 88 A2 00 00 00 48 8B 47 18 48 85 C0  ; test eax, eax ; js loc_fail_cleanup`,
    `0x00007FF8B100: F3 0F 1E FA 55 48 89 E5 41 57 41 56 41 55 41  ; endbr64 ; push rbp ; mov rbp, rsp\n0x00007FF8B110: 49 89 D6 49 89 F7 48 83 EC 48 64 48 8B 04 25  ; mov r14, rdx ; mov r15, rsi ; fs:0x28`,
  ],
};

/**
 * Generates realistic disguised code corresponding to the length and content of `realText`.
 * Every character typed reveals ~2.2 characters of authentic-looking systems code.
 */
export function encodeToDisguisedCode(
  realText: string,
  lang: 'rust-kernel' | 'cpp-vulkan' | 'asm-hex' = 'rust-kernel',
  seedOffset = 0
): string {
  if (!realText) return '';
  const pool = CODE_TEMPLATES[lang] || CODE_TEMPLATES['rust-kernel'];
  const fullPool = pool.join('\n\n');

  // Multiplier so typing 1 char of natural prompt looks like rapid 2-3 chars of code typing
  const targetLen = Math.min(realText.length * 2, fullPool.length);
  const startIdx = seedOffset % Math.max(1, pool.length);
  const rotatedPool = pool.slice(startIdx).concat(pool.slice(0, startIdx)).join('\n\n');

  if (targetLen <= rotatedPool.length) {
    return rotatedPool.slice(0, targetLen);
  }
  return rotatedPool + '\n' + rotatedPool.slice(0, (realText.length * 2) % rotatedPool.length);
}

/**
 * Generates a realistic Kernel/Compiler trace header for a chat message
 */
export function generateDisguisedHeader(role: 'user' | 'assistant' | 'system', index: number, timestamp: string): string {
  const hexAddr = (0x7ff8a000 + index * 0x1a4).toString(16).toUpperCase();
  const timeShort = timestamp.slice(11, 19) || '00:00:00';
  if (role === 'user') {
    return `[IRQ_DISPATCH 0x${hexAddr} @ ${timeShort}] >> syscall::invoke_frame(ring0_ctx, 0x${(index + 12).toString(16)})`;
  }
  if (role === 'assistant') {
    return `[DMA_TRACE_RET 0x${hexAddr} @ ${timeShort}] << mmu::resolve_page_fault(status=0x00_OK)`;
  }
  return `[KERN_NOTICE 0x${hexAddr} @ ${timeShort}] :: sync_subsystem_barrier()`;
}

/**
 * Generates a deterministic uppercase hex hash string of length `len` from any input string.
 */
export function hashToHex(input: string, len = 6): string {
  const str = input || 'ndev_ring0';
  let h1 = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  let hex = (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  while (hex.length < len) {
    h1 = Math.imul(h1 ^ 0x5bd1e995, 0x01000193);
    hex += (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }
  return hex.slice(0, len);
}

export function normalizeKeyEventName(rawKey: string): string {
  if (!rawKey) return '';
  if (rawKey === ' ') return 'Space';
  if (rawKey === 'Control') return 'Control';
  if (rawKey === 'Meta') return 'CommandOrControl';
  if (rawKey.startsWith('Arrow')) return rawKey.replace('Arrow', '');
  if (rawKey.length === 1) return rawKey.toUpperCase();
  return rawKey;
}

export function formatHoldKeyDisplay(configuredKey?: string): string {
  const cleaned = (configuredKey || 'Alt').trim();
  if (!cleaned) return 'ALT';
  return cleaned.replace(/CommandOrControl/gi, 'Ctrl').toUpperCase();
}

export function isHoldKeyMatch(
  e: KeyboardEvent | { key: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; shiftKey?: boolean },
  configuredKey = 'Alt',
  phase: 'down' | 'up' = 'down'
): boolean {
  const spec = (configuredKey || 'Alt').trim();
  if (!spec) return false;

  const parts = spec
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);
  const eventKey = normalizeKeyEventName(e.key);

  if (parts.length === 1) {
    const single = parts[0].toLowerCase();
    if (single === 'alt') {
      return eventKey.toLowerCase() === 'alt';
    }
    if (single === 'control' || single === 'ctrl' || single === 'commandorcontrol') {
      return eventKey.toLowerCase() === 'control' || eventKey.toLowerCase() === 'commandorcontrol';
    }
    if (single === 'shift') {
      return eventKey.toLowerCase() === 'shift';
    }
    return eventKey.toLowerCase() === single;
  }

  // Multi-key combination (e.g., Alt+Z, CommandOrControl+Shift, etc.)
  let reqCtrl = false;
  let reqAlt = false;
  let reqShift = false;
  let mainPart = '';

  for (const p of parts) {
    const low = p.toLowerCase();
    if (low === 'control' || low === 'ctrl' || low === 'commandorcontrol') reqCtrl = true;
    else if (low === 'alt') reqAlt = true;
    else if (low === 'shift') reqShift = true;
    else mainPart = low;
  }

  if (phase === 'down') {
    if (reqCtrl && !(e.ctrlKey || e.metaKey || eventKey.toLowerCase() === 'control')) return false;
    if (reqAlt && !(e.altKey || eventKey.toLowerCase() === 'alt')) return false;
    if (reqShift && !(e.shiftKey || eventKey.toLowerCase() === 'shift')) return false;
    if (mainPart && eventKey.toLowerCase() !== mainPart) return false;
    return true;
  } else {
    // On keyup, releasing any constituent key of the combo releases the hold state
    const lowEvent = eventKey.toLowerCase();
    if (reqCtrl && (lowEvent === 'control' || lowEvent === 'commandorcontrol')) return true;
    if (reqAlt && lowEvent === 'alt') return true;
    if (reqShift && lowEvent === 'shift') return true;
    if (mainPart && lowEvent === mainPart) return true;
    return false;
  }
}

