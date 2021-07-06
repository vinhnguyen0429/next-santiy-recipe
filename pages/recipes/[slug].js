import {
  sanityClient,
  urlFor,
  usePreviewSubscriptionHook,
  PortableText,
} from "../../lib/sanity";

import { useRouter } from "next/router";
import { useState } from "react";

const recipesQuery = `*[_type == "recipe" && slug.current == $slug][0]{
	_id,
	name,
	slug,
	mainImage,
	ingredient[]{
		_key,
		unit,
		wholeNumber,
		fraction,
		ingredient->{
			name
		}
	},
	instructions,
	likes
}`;

export default function OneRecipe({ data, preview }) {
  const router = useRouter();

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading ...</div>;
  }
  const { data: recipe } = usePreviewSubscriptionHook(recipesQuery, {
    params: { slug: data.recipe?.slug.current },
    initialData: data,
    enabled: preview,
  });

  const [likes, setLikes] = useState(data?.recipe?.likes);

  const addLikes = async () => {
    const res = await fetch("/api/handle-likes", {
      method: "POST",
      body: JSON.stringify({ _id: recipe._id }),
    }).catch((error) => console.log(error));

    const data = await res.json();

    setLikes(data.likes);
  };

  return (
    <article className="recipe">
      <h1>{recipe.name}</h1>
      <button className="like-button" onClick={addLikes}>
        {likes} ❤️
      </button>
      <main className="content">
        <img src={urlFor(recipe?.mainImage).url()} alt={recipe.name} />
        <div className="breakdown">
          <ul className="ingredients">
            {recipe.ingredient?.map((ingredient) => (
              <li key={ingredient._key} className="ingredient">
                {ingredient?.wholeNumber}
                {ingredient?.fraction} {ingredient?.unit}
                <br />
                {ingredient?.ingredient?.name}
              </li>
            ))}
          </ul>
          <PortableText blocks={recipe.instructions} className="instructions" />
        </div>
      </main>
    </article>
  );
}

export async function getStaticPaths() {
  const paths = await sanityClient.fetch(
    `*[_type == "recipe" && defined(slug.current)]{
			"params": {
				"slug": slug.current
			}
		}`
  );

  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const recipe = await sanityClient.fetch(recipesQuery, { slug });
  return { props: { data: { recipe }, preview: true } };
}
