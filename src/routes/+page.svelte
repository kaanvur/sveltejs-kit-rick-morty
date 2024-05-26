<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Button,
		Dropdown,
		Checkbox,
		Helper,
		Search,
		Label,
		Badge,
		Spinner
	} from 'flowbite-svelte';
    import viewport from '$lib/useViewportAction';

	interface Character {
		id: number;
		name: string;
		image: string;
		episode: string[];
		loaded: boolean;
	}
	let characters: Character[] = [];
	let selectedCharacters: Character[] = [];
	let searchQuery = '';
	let errorMessage = '';
	let nextUrl: string | null = null;

	let searchTimeout: NodeJS.Timeout;
	async function handleSearchInput() {
		errorMessage = '';
		nextUrl = null;
		try {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(async () => {
				const response = await fetch(
					`https://rickandmortyapi.com/api/character/?name=${searchQuery}`
				);
				const data = await response.json();
				if (!data.results) {
					return (errorMessage = data.error);
				}
				characters = data.results.map((character: Character) => ({
					...character,
					loaded: false
				}));
				if (data.info && data.info.next) {
					nextUrl = data.info.next;
				}
			}, 400);
		} catch (error: any) {
			console.error(error);
		}
	}

	onMount(handleSearchInput);

	function handleSelect(character: Character) {
		if (selectedCharacters.some(({ id }) => id === character.id)) {
			selectedCharacters = selectedCharacters.filter(({ id }) => id !== character.id);
		} else {
			selectedCharacters = [...selectedCharacters, character];
		}
	}

	function handleClose(event: CustomEvent, character: Character) {
		handleSelect(character);
	}

	let characterImageLoaded: Record<number, boolean> = {};

	function handleImageLoad(characterId: number) {
		characterImageLoaded[characterId] = true;
	}

	async function loadNextPage() {
		try {
			if (!nextUrl) {
				return;
			}
			const response = await fetch(nextUrl);
			const data = await response.json();
			if (!data.results) {
				return (errorMessage = data.error);
			}
			characters = [
				...characters,
				...data.results.map((character: Character) => ({
					...character,
					loaded: false
				}))
			];
			if (data.info && data.info.next) {
				nextUrl = data.info.next;
			} else {
				nextUrl = null;
			}
		} catch (error: any) {
			console.error(error);
		}
	}
</script>

	<Button 
		class="gap-1 w-full min-h-[50px] flex-wrap {selectedCharacters.length > 0
			? 'justify-start'
			: 'justify-center'}"
	>
		{#if selectedCharacters.length > 0}
			{#each selectedCharacters as selectedCharacter (selectedCharacter.id)}
				<Badge dismissable large on:close={(event) => handleClose(event, selectedCharacter)}
					>{selectedCharacter.name}</Badge
				>
			{/each}
		{:else}
			Select Characters
		{/if}
	</Button>
	<Dropdown class="overflow-y-auto py-1 h-48 divide-y" classContainer="w-full" >
		<div slot="header" class="p-3" >
			<Search size="md" bind:value={searchQuery} on:input={handleSearchInput} />
		</div>
		{#if errorMessage}
			<div class="p-2 text-center">{errorMessage}</div>
		{:else}
			{#each characters as character}
				<li class="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex space-x-4">
					<Checkbox
						id="checkbox-{character.id}"
						on:click={() => handleSelect(character)}
						checked={selectedCharacters.some(({ id }) => id === character.id)}
					/>
					<Label for="checkbox-{character.id}" class="flex grow">
						<img
							alt={character.name}	
							src={character.image}
							class="aspect-square rounded w-10 h-10 bg-gray-200 dark:bg-gray-600 {characterImageLoaded[
								character.id
							]
								? ''
								: 'animate-pulse'}"
							on:load={() => handleImageLoad(character.id)}
						/>

						<div class="ps-3 w-full">
							{character.name}
							<Helper>{character.episode.length} Episodes</Helper>
						</div>
					</Label>
				</li>
			{/each}
		{/if}
		{#if nextUrl}
			<li class="p-2 text-center" use:viewport on:enterViewport={loadNextPage}>
				<Spinner size="11" />
			</li>
		{/if}
	</Dropdown>
