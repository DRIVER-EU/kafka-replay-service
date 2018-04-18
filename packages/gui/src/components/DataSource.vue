<template>
  <h1 v-if="widget.content">
      {{ widget.content.answer }}
    </h1>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { AppState, WidgetBase } from "@csnext/cs-client";

@Component
export default class DataSource extends WidgetBase {}

</script>
