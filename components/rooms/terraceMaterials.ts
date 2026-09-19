"use client";
import * as THREE from "three";

/** Dedicated terrace finish palette; kept local so shared scene materials remain untouched. */
export const terraceIronMaterial = new THREE.MeshPhysicalMaterial({ color: "#302c27", metalness: 0.78, roughness: 0.34, clearcoat: 0.18, envMapIntensity: 1.1 });
export const terraceStoneMaterial = new THREE.MeshPhysicalMaterial({ color: "#b9a58a", roughness: 0.8, metalness: 0.02, clearcoat: 0.08, envMapIntensity: 0.7 });
export const terraceCushionMaterial = new THREE.MeshPhysicalMaterial({ color: "#ded3bf", roughness: 0.94, sheen: 0.55, sheenColor: new THREE.Color("#fff8e9"), sheenRoughness: 0.82 });
export const terraceWoodMaterial = new THREE.MeshPhysicalMaterial({ color: "#8b5634", roughness: 0.62, metalness: 0.02, clearcoat: 0.12, envMapIntensity: 0.8 });
