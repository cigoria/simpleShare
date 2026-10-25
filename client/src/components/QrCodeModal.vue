<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
    @click.self="$emit('close')"
  >
    <div
      class="bg-black/80 backdrop-blur-[20px] border border-[#a1a1a1] rounded-[24px] p-8 mobile:p-6 w-[380px] mobile:w-[92vw] flex flex-col items-center gap-5 animate-scale-in relative shadow-2xl"
      @click.stop
    >
      <!-- Close button -->
      <button
        class="absolute top-4 right-4 bg-primary-button text-black w-9 h-9 rounded-lg flex items-center justify-center hover:scale-110 transition-all duration-200 hover:shadow-lg hover:shadow-primary-button/50"
        @click="$emit('close')"
      >
        <span class="material-icons-outlined text-sm">close</span>
      </button>

      <!-- Header -->
      <div class="text-center">
        <p class="text-gray-400 text-sm font-inter">QR Code for</p>
        <p class="text-white font-red-hat font-bold text-xl tracking-wider mt-1">
          {{ label }}
        </p>
        <p class="text-primary-button font-red-hat text-sm truncate max-w-[280px] mt-1" :title="url">
          {{ url }}
        </p>
      </div>

      <!-- QR Canvas -->
      <div class="bg-white rounded-xl p-3 shadow-lg">
        <canvas ref="qrCanvas" class="block"></canvas>
      </div>

      <!-- Generating placeholder -->
      <div
        v-if="isGenerating"
        class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[24px]"
      >
        <span class="material-icons-outlined text-4xl text-primary-button animate-spin">refresh</span>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 w-full">
        <button
          @click="downloadQR"
          class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-button text-black rounded-lg font-medium text-sm hover:opacity-80 transition-opacity hover:scale-105 duration-200"
        >
          <span class="material-icons-outlined text-base">download</span>
          Download PNG
        </button>
        <button
          @click="copyUrl"
          class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-700 text-white rounded-lg font-medium text-sm hover:opacity-80 transition-opacity hover:scale-105 duration-200"
        >
          <span class="material-icons-outlined text-base">{{ copyDone ? 'check' : 'content_copy' }}</span>
          {{ copyDone ? 'Copied!' : 'Copy URL' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import QRCode from "qrcode";

export default {
  name: "QrCodeModal",
  props: {
    visible: Boolean,
    url: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
    },
  },
  emits: ["close"],
  data() {
    return {
      isGenerating: false,
      copyDone: false,
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.$nextTick(() => this.generateQR());
      }
    },
    url() {
      if (this.visible) {
        this.$nextTick(() => this.generateQR());
      }
    },
  },
  methods: {
    async generateQR() {
      if (!this.url || !this.$refs.qrCanvas) return;
      this.isGenerating = true;
      try {
        await QRCode.toCanvas(this.$refs.qrCanvas, this.url, {
          width: 240,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });
      } catch (err) {
        console.error("QR generation failed:", err);
      } finally {
        this.isGenerating = false;
      }
    },

    downloadQR() {
      const canvas = this.$refs.qrCanvas;
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `qr-${this.label || "code"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    },

    async copyUrl() {
      try {
        await navigator.clipboard.writeText(this.url);
        this.copyDone = true;
        setTimeout(() => (this.copyDone = false), 2000);
      } catch (err) {
        console.error("Failed to copy URL:", err);
      }
    },
  },
};
</script>
